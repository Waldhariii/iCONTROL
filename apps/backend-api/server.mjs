import http from "http";
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync, statSync } from "fs";
import { join, normalize } from "path";
import { execSync } from "child_process";
import { applyOpsToDir } from "../../platform/runtime/changes/patch-engine.mjs";
import { loadManifest } from "../../platform/runtime/loader/loader.mjs";
import { sha256, stableStringify } from "../../platform/compilers/utils.mjs";

const PORT = process.env.PORT || 7070;
const ROOT = process.cwd();
const SSOT_DIR = process.env.SSOT_DIR ? normalize(process.env.SSOT_DIR) : normalize(join(ROOT, "platform/ssot"));
const ssotPath = (p) => join(SSOT_DIR, p);

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJson(path, data) {
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function json(res, code, payload) {
  res.writeHead(code, { "Content-Type": "application/json" });
  res.end(JSON.stringify(payload));
}

function bodyToJson(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
  });
}

function ensureChangeset(id) {
  const csPath = ssotPath(`changes/changesets/${id}.json`);
  if (!existsSync(csPath)) throw new Error("Changeset not found");
  const cs = readJson(csPath);
  if (cs.status !== "draft") throw new Error("Changeset not in draft state");
  return cs;
}

function appendAudit(entry) {
  const path = ssotPath("governance/audit_ledger.json");
  const ledger = existsSync(path) ? readJson(path) : [];
  const prev = ledger.length ? ledger[ledger.length - 1].hash : "GENESIS";
  const payload = { ...entry, prev_hash: prev };
  const hash = sha256(stableStringify(payload));
  ledger.push({ ...payload, hash });
  writeJson(path, ledger);
}

function requireAdmin(req) {
  const role = req.headers["x-role"];
  if (role !== "cp.admin") throw new Error("Forbidden");
}

function requirePermission(req, perm) {
  const role = req.headers["x-role"];
  if (role === "cp.admin") return;
  const perms = (req.headers["x-permissions"] || "").split(",").map((s) => s.trim());
  if (!perms.includes(perm)) throw new Error("Forbidden");
}

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const s = join(src, entry.name);
    const d = join(dest, entry.name);
    if (s.includes("/changes/snapshots") || s.includes("/changes/changesets") || s.includes("/changes/releases")) continue;
    if (entry.isDirectory()) copyDir(s, d);
    else writeFileSync(d, readFileSync(s));
  }
}

function latestReleaseId() {
  const dir = ssotPath("changes/releases");
  if (!existsSync(dir)) return "";
  const files = readdirSync(dir).filter((f) => f.endsWith(".json"));
  if (!files.length) return "";
  const latest = files
    .map((f) => ({ f, t: statSync(join(dir, f)).mtimeMs }))
    .sort((a, b) => b.t - a.t)[0].f;
  return latest.replace(".json", "");
}

function readActiveRelease() {
  const path = ssotPath("changes/active_release.json");
  if (!existsSync(path)) return { active_release_id: "", active_env: "dev" };
  return readJson(path);
}

const server = http.createServer(async (req, res) => {
  try {
    if (req.url?.startsWith("/api/")) requireAdmin(req);

    if (req.method === "POST" && req.url === "/api/changesets") {
      requirePermission(req, "studio.pages.edit");
      const id = `cs-${Date.now()}`;
      mkdirSync(ssotPath("changes/changesets"), { recursive: true });
      const cs = { id, status: "draft", created_by: "api", created_at: new Date().toISOString(), scope: "global", ops: [] };
      writeJson(ssotPath(`changes/changesets/${id}.json`), cs);
      appendAudit({ event: "changeset_created", changeset_id: id, at: cs.created_at });
      return json(res, 201, cs);
    }

    if (req.method === "GET" && req.url?.startsWith("/api/changesets/")) {
      requirePermission(req, "studio.pages.view");
      const id = req.url.split("/")[3];
      const csPath = ssotPath(`changes/changesets/${id}.json`);
      return json(res, 200, readJson(csPath));
    }

    if (req.method === "POST" && req.url?.startsWith("/api/changesets/") && req.url?.endsWith("/ops")) {
      requirePermission(req, "studio.pages.edit");
      const id = req.url.split("/")[3];
      const csPath = ssotPath(`changes/changesets/${id}.json`);
      const cs = ensureChangeset(id);
      const payload = await bodyToJson(req);
      cs.ops.push(payload);
      writeJson(csPath, cs);
      appendAudit({ event: "changeset_op_added", changeset_id: id, at: new Date().toISOString() });
      return json(res, 200, cs);
    }

    if (req.method === "POST" && req.url?.startsWith("/api/changesets/") && req.url?.endsWith("/preview")) {
      requirePermission(req, "studio.pages.edit");
      const id = req.url.split("/")[3];
      const cs = ensureChangeset(id);
      const previewDir = `./platform/runtime/preview/${id}`;
      const previewSsot = join(previewDir, "ssot");
      const previewManifests = join(previewDir, "manifests");
      mkdirSync(previewSsot, { recursive: true });
      mkdirSync(previewManifests, { recursive: true });
      copyDir(SSOT_DIR, previewSsot);
      applyOpsToDir(previewSsot, cs.ops);
      execSync(`node scripts/ci/compile.mjs preview-${id} dev`, {
        stdio: "inherit",
        env: { ...process.env, SSOT_DIR: previewSsot, OUT_DIR: previewManifests }
      });
      appendAudit({ event: "changeset_preview", changeset_id: id, at: new Date().toISOString() });
      return json(res, 200, { preview_release: `preview-${id}` });
    }

    if (req.method === "POST" && req.url?.startsWith("/api/changesets/") && req.url?.endsWith("/validate")) {
      requirePermission(req, "studio.pages.edit");
      const id = req.url.split("/")[3];
      execSync(`node governance/gates/run-gates.mjs preview-${id}`, {
        stdio: "inherit",
        env: {
          ...process.env,
          SSOT_DIR: `./platform/runtime/preview/${id}/ssot`,
          MANIFESTS_DIR: `./platform/runtime/preview/${id}/manifests`
        }
      });
      appendAudit({ event: "changeset_validate", changeset_id: id, at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && req.url?.startsWith("/api/changesets/") && req.url?.endsWith("/publish")) {
      requirePermission(req, "studio.releases.publish");
      const id = req.url.split("/")[3];
      execSync(`node scripts/ci/release.mjs --from-changeset ${id} --env dev --strategy canary`, {
        stdio: "inherit",
        env: { ...process.env, SSOT_DIR }
      });
      appendAudit({ event: "changeset_publish", changeset_id: id, at: new Date().toISOString() });
      return json(res, 200, { ok: true, release_id: latestReleaseId() });
    }

    if (req.method === "GET" && req.url?.startsWith("/api/runtime/manifest")) {
      const url = new URL(req.url, "http://localhost");
      const releaseId = url.searchParams.get("release") || readActiveRelease().active_release_id || latestReleaseId();
      const previewId = url.searchParams.get("preview");
      if (!releaseId) return json(res, 404, { error: "No release available" });
      const manifestsDir = previewId ? `./platform/runtime/preview/${previewId}/manifests` : undefined;
      const manifest = loadManifest({ releaseId, stalenessMs: 0, manifestsDir });
      return json(res, 200, manifest);
    }

    if (req.method === "GET" && req.url?.startsWith("/api/runtime/active-release")) {
      return json(res, 200, readActiveRelease());
    }

    if (req.method === "POST" && req.url === "/api/studio/pages") {
      requirePermission(req, "studio.pages.edit");
      const payload = await bodyToJson(req);
      const { changeset_id, page_definition, page_version } = payload;
      ensureChangeset(changeset_id);
      const ops = [
        { op: "add", target: { kind: "page_definition", ref: page_definition.id }, value: page_definition, preconditions: { expected_exists: false } },
        { op: "add", target: { kind: "page_version", ref: page_version.page_id }, value: page_version, preconditions: { expected_exists: false } }
      ];
      for (const op of ops) {
        const cs = readJson(ssotPath(`changes/changesets/${changeset_id}.json`));
        cs.ops.push(op);
        writeJson(ssotPath(`changes/changesets/${changeset_id}.json`), cs);
      }
      appendAudit({ event: "studio_page_create", changeset_id: changeset_id, at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "PATCH" && req.url?.startsWith("/api/studio/pages/")) {
      requirePermission(req, "studio.pages.edit");
      const pageId = req.url.split("/")[4];
      const payload = await bodyToJson(req);
      const { changeset_id, value } = payload;
      ensureChangeset(changeset_id);
      const op = { op: "update", target: { kind: "page_definition", ref: pageId }, value, preconditions: { expected_exists: true } };
      const cs = readJson(ssotPath(`changes/changesets/${changeset_id}.json`));
      cs.ops.push(op);
      writeJson(ssotPath(`changes/changesets/${changeset_id}.json`), cs);
      appendAudit({ event: "studio_page_update", changeset_id: changeset_id, at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && req.url === "/api/studio/routes") {
      requirePermission(req, "studio.routes.edit");
      const payload = await bodyToJson(req);
      const { changeset_id, route_spec } = payload;
      ensureChangeset(changeset_id);
      const op = { op: "add", target: { kind: "route_spec", ref: route_spec.route_id }, value: route_spec, preconditions: { expected_exists: false } };
      const cs = readJson(ssotPath(`changes/changesets/${changeset_id}.json`));
      cs.ops.push(op);
      writeJson(ssotPath(`changes/changesets/${changeset_id}.json`), cs);
      appendAudit({ event: "studio_route_add", changeset_id: changeset_id, at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "PATCH" && req.url?.startsWith("/api/studio/routes/")) {
      requirePermission(req, "studio.routes.edit");
      const routeId = req.url.split("/")[4];
      const payload = await bodyToJson(req);
      const { changeset_id, value } = payload;
      ensureChangeset(changeset_id);
      const op = { op: "update", target: { kind: "route_spec", ref: routeId }, value, preconditions: { expected_exists: true } };
      const cs = readJson(ssotPath(`changes/changesets/${changeset_id}.json`));
      cs.ops.push(op);
      writeJson(ssotPath(`changes/changesets/${changeset_id}.json`), cs);
      appendAudit({ event: "studio_route_update", changeset_id: changeset_id, at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "DELETE" && req.url?.startsWith("/api/studio/routes/")) {
      requirePermission(req, "studio.routes.delete");
      const routeId = req.url.split("/")[4];
      const payload = await bodyToJson(req);
      const { changeset_id } = payload;
      ensureChangeset(changeset_id);
      const op = { op: "delete_request", target: { kind: "route_spec", ref: routeId }, preconditions: { expected_exists: true } };
      const cs = readJson(ssotPath(`changes/changesets/${changeset_id}.json`));
      cs.ops.push(op);
      writeJson(ssotPath(`changes/changesets/${changeset_id}.json`), cs);
      appendAudit({ event: "studio_route_delete", changeset_id: changeset_id, at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && req.url === "/api/studio/nav") {
      requirePermission(req, "studio.nav.edit");
      const payload = await bodyToJson(req);
      const { changeset_id, nav_spec } = payload;
      ensureChangeset(changeset_id);
      const op = { op: "add", target: { kind: "nav_spec", ref: nav_spec.id }, value: nav_spec, preconditions: { expected_exists: false } };
      const cs = readJson(ssotPath(`changes/changesets/${changeset_id}.json`));
      cs.ops.push(op);
      writeJson(ssotPath(`changes/changesets/${changeset_id}.json`), cs);
      appendAudit({ event: "studio_nav_add", changeset_id: changeset_id, at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "PATCH" && req.url?.startsWith("/api/studio/nav/")) {
      requirePermission(req, "studio.nav.edit");
      const navId = req.url.split("/")[4];
      const payload = await bodyToJson(req);
      const { changeset_id, value } = payload;
      ensureChangeset(changeset_id);
      const op = { op: "update", target: { kind: "nav_spec", ref: navId }, value, preconditions: { expected_exists: true } };
      const cs = readJson(ssotPath(`changes/changesets/${changeset_id}.json`));
      cs.ops.push(op);
      writeJson(ssotPath(`changes/changesets/${changeset_id}.json`), cs);
      appendAudit({ event: "studio_nav_update", changeset_id: changeset_id, at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "DELETE" && req.url?.startsWith("/api/studio/nav/")) {
      requirePermission(req, "studio.nav.delete");
      const navId = req.url.split("/")[4];
      const payload = await bodyToJson(req);
      const { changeset_id } = payload;
      ensureChangeset(changeset_id);
      const op = { op: "delete_request", target: { kind: "nav_spec", ref: navId }, preconditions: { expected_exists: true } };
      const cs = readJson(ssotPath(`changes/changesets/${changeset_id}.json`));
      cs.ops.push(op);
      writeJson(ssotPath(`changes/changesets/${changeset_id}.json`), cs);
      appendAudit({ event: "studio_nav_delete", changeset_id: changeset_id, at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "POST" && req.url === "/api/studio/widgets") {
      requirePermission(req, "studio.pages.edit");
      const payload = await bodyToJson(req);
      const { changeset_id, widget_instance } = payload;
      ensureChangeset(changeset_id);
      const op = { op: "add", target: { kind: "widget_instance", ref: widget_instance.id }, value: widget_instance, preconditions: { expected_exists: false } };
      const cs = readJson(ssotPath(`changes/changesets/${changeset_id}.json`));
      cs.ops.push(op);
      writeJson(ssotPath(`changes/changesets/${changeset_id}.json`), cs);
      appendAudit({ event: "studio_widget_add", changeset_id: changeset_id, at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "DELETE" && req.url?.startsWith("/api/studio/pages/")) {
      requirePermission(req, "studio.delete");
      const pageId = req.url.split("/")[4];
      const payload = await bodyToJson(req);
      const { changeset_id } = payload;
      ensureChangeset(changeset_id);
      const op = { op: "delete_request", target: { kind: "page_definition", ref: pageId }, preconditions: { expected_exists: true }, reason: "studio delete" };
      const cs = readJson(ssotPath(`changes/changesets/${changeset_id}.json`));
      cs.ops.push(op);
      writeJson(ssotPath(`changes/changesets/${changeset_id}.json`), cs);
      execSync(`node platform/runtime/deletion/orchestrator.mjs ${changeset_id} dev-001`, { stdio: "inherit" });
      appendAudit({ event: "studio_page_delete", changeset_id: changeset_id, at: new Date().toISOString() });
      return json(res, 200, { ok: true });
    }

    if (req.method === "GET" && req.url === "/api/studio/routes") {
      requirePermission(req, "studio.routes.view");
      return json(res, 200, readJson(ssotPath("studio/routes/route_specs.json")));
    }

    if (req.method === "GET" && req.url === "/api/studio/nav") {
      requirePermission(req, "studio.nav.view");
      return json(res, 200, readJson(ssotPath("studio/nav/nav_specs.json")));
    }

    if (req.method === "GET" && req.url === "/api/releases") {
      requirePermission(req, "studio.releases.view");
      const dir = ssotPath("changes/releases");
      if (!existsSync(dir)) return json(res, 200, []);
      const releases = readdirSync(dir)
        .filter((f) => f.endsWith(".json"))
        .map((f) => readJson(join(dir, f)));
      return json(res, 200, releases);
    }

    if (req.method === "POST" && req.url?.startsWith("/api/releases/") && req.url?.endsWith("/activate")) {
      requirePermission(req, "studio.releases.activate");
      const id = req.url.split("/")[3];
      const payload = await bodyToJson(req);
      const changesetId = payload?.changeset_id || `cs-activate-${Date.now()}`;
      const csPath = ssotPath(`changes/changesets/${changesetId}.json`);
      if (!existsSync(csPath)) {
        mkdirSync(ssotPath("changes/changesets"), { recursive: true });
        writeJson(csPath, { id: changesetId, status: "draft", created_by: "api", created_at: new Date().toISOString(), scope: "global", ops: [] });
      }
      const op = {
        op: "update",
        target: { kind: "active_release", ref: "active_release" },
        value: {
          active_release_id: id,
          active_env: payload?.env || "dev",
          updated_at: new Date().toISOString(),
          updated_by: "studio"
        },
        preconditions: { expected_exists: true }
      };
      const cs = readJson(csPath);
      cs.ops.push(op);
      writeJson(csPath, cs);
      execSync(`node scripts/ci/apply-changeset.mjs ${changesetId}`, { stdio: "inherit", env: { ...process.env, SSOT_DIR } });
      appendAudit({ event: "active_release_update", release_id: id, at: new Date().toISOString() });
      return json(res, 200, { ok: true, active_release_id: id });
    }

    if (req.method === "POST" && req.url?.startsWith("/api/releases/") && req.url?.endsWith("/rollback")) {
      requirePermission(req, "studio.releases.rollback");
      const id = req.url.split("/")[3];
      execSync(`node -e \"import {rollback} from './platform/runtime/release/orchestrator.mjs'; rollback('${id}','manual');\"`, { stdio: "inherit" });
      return json(res, 200, { ok: true });
    }

    if (req.method === "GET" && req.url?.startsWith("/api/gates/") && req.url?.endsWith("/report")) {
      requirePermission(req, "studio.releases.view");
      const id = req.url.split("/")[3];
      const path = "./governance/gates/gates-report.json";
      if (!existsSync(path)) return json(res, 404, { error: "No gates report" });
      return json(res, 200, readJson(path));
    }

    if (req.method === "GET" && req.url === "/api/drift/status") {
      return json(res, 200, { status: "unknown" });
    }

    if (req.method === "GET" && req.url === "/api/drift/report") {
      const path = "./platform/runtime/drift/drift-report.md";
      return json(res, 200, { report: existsSync(path) ? readFileSync(path, "utf-8") : "" });
    }

    return json(res, 404, { error: "Not found" });
  } catch (err) {
    return json(res, 400, { error: String(err.message || err) });
  }
});

server.listen(PORT, () => {
  console.log(`Write Gateway listening on ${PORT}`);
});
