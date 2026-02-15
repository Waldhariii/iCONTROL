import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join, dirname } from "path";
import { applyAction, BUILTIN_ACTIONS } from "./actions.mjs";

const RUNTIME_OPS_DIR = join(process.cwd(), "runtime", "ops");

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function scopeMatches(pattern, scope) {
  if (pattern === scope) return true;
  if (pattern.endsWith(":*")) return scope.startsWith(pattern.slice(0, -1));
  if (pattern === "platform:*" && scope.startsWith("platform:")) return true;
  if (pattern === "tenant:*" && scope.startsWith("tenant:")) return true;
  return false;
}

export function appendTimeline(event) {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const dir = join(RUNTIME_OPS_DIR, "timeline");
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${day}.jsonl`);
  writeFileSync(path, JSON.stringify(event) + "\n", { flag: "a" });
  return path;
}

export function createIncident({ severity_id, scope, title, links, notes }) {
  const id = `inc-${Date.now()}`;
  const incident = {
    id,
    created_at: new Date().toISOString(),
    severity_id,
    scope,
    title,
    status: "open",
    links: links || {},
    notes: notes || []
  };
  const dir = join(RUNTIME_OPS_DIR, "incidents");
  mkdirSync(dir, { recursive: true });
  writeJson(join(dir, `${id}.json`), incident);
  appendTimeline({ timestamp: new Date().toISOString(), actor: "ops", action: "incident.create", result: "ok", incident_id: id });
  return incident;
}

export function readIncident(id) {
  const path = join(RUNTIME_OPS_DIR, "incidents", `${id}.json`);
  if (!existsSync(path)) return null;
  return readJson(path);
}

export function listIncidents() {
  const dir = join(RUNTIME_OPS_DIR, "incidents");
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => readJson(join(dir, f)));
}

export function loadRunbookFromManifest(manifest, runbookId, version) {
  const runbooks = manifest?.ops?.runbooks || [];
  const versions = manifest?.ops?.runbook_versions || [];
  const rb = runbooks.find((r) => r.runbook_id === runbookId);
  if (!rb) throw new Error("Runbook not found");
  const ver = version || rb.latest_version;
  const rv = versions.find((v) => v.runbook_id === runbookId && v.version === ver);
  if (!rv) throw new Error("Runbook version not found");
  return { runbook: rb, version: rv };
}

function findPolicy(manifest, severityId, scope) {
  const policies = manifest?.ops?.mitigation_policies || [];
  return policies.find((p) => p.severity_id === severityId && scopeMatches(p.scope, scope)) || null;
}

function breakGlassAllows(breakGlass, action, scope) {
  if (!breakGlass?.enabled) return false;
  const exp = Date.parse(breakGlass.expires_at || "");
  if (!Number.isFinite(exp) || exp <= Date.now()) return false;
  if (!breakGlass.allowed_actions?.includes(action)) return false;
  if (!scopeMatches(breakGlass.scope, scope)) return false;
  return true;
}

export function executeRunbook({ incidentId, runbookId, version, context, manifest, policy, authorizeAction, requireQuorum, breakGlass, apply }) {
  const incident = readIncident(incidentId);
  if (!incident) throw new Error("Incident not found");
  const { runbook, version: rv } = loadRunbookFromManifest(manifest, runbookId, version);
  const policyRule = policy || findPolicy(manifest, incident.severity_id, incident.scope);
  if (!policyRule) throw new Error("Mitigation policy missing");

  const results = [];
  for (const step of rv.steps || []) {
    if (!BUILTIN_ACTIONS.includes(step.action)) throw new Error(`Unknown action: ${step.action}`);
    if (!(policyRule.allowed_actions || []).includes(step.action)) throw new Error(`Action not allowed: ${step.action}`);
    const needsQuorum = (policyRule.require_quorum_actions || []).includes(step.action) || step.critical === true;
    if (apply) {
      authorizeAction(step.action, incident.scope, { incident_id: incidentId, runbook_id: runbookId });
      if (needsQuorum && !breakGlassAllows(breakGlass, step.action, incident.scope)) {
        requireQuorum(step.action, incidentId, 2);
      }
      const res = applyAction({ action: step.action, params: step.params || {}, context: { incident_id: incidentId, runbook_id: runbookId, ...context } });
      results.push({ action: step.action, ok: true, result: res });
      appendTimeline({ timestamp: new Date().toISOString(), actor: "ops", action: step.action, result: "applied", incident_id: incidentId });
    } else {
      results.push({ action: step.action, ok: true, result: "dry-run" });
      appendTimeline({ timestamp: new Date().toISOString(), actor: "ops", action: step.action, result: "dry-run", incident_id: incidentId });
    }
  }

  return { incident, runbook, version: rv, results };
}

export function listTimeline(day) {
  const dir = join(RUNTIME_OPS_DIR, "timeline");
  if (!existsSync(dir)) return [];
  const file = day ? join(dir, `${day}.jsonl`) : null;
  const pick = file && existsSync(file)
    ? [file]
    : readdirSync(dir).filter((f) => f.endsWith(".jsonl")).map((f) => join(dir, f)).slice(-1);
  const lines = [];
  for (const f of pick) {
    const content = readFileSync(f, "utf-8").trim();
    if (!content) continue;
    for (const line of content.split("\n")) {
      try {
        lines.push(JSON.parse(line));
      } catch {
        // ignore
      }
    }
  }
  return lines;
}
