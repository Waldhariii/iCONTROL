import { readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, readdirSync, renameSync } from "fs";
import { join, dirname } from "path";
import { sha256, stableStringify } from "../../compilers/utils.mjs";
import { validateOrThrow } from "../../../core/contracts/schema/validate.mjs";

const SSOT_DIR = process.env.SSOT_DIR || "./platform/ssot";
const LOCK_PATH = "./platform/runtime/changes/changes.lock";
const SNAPSHOT_DIR = join(SSOT_DIR, "changes/snapshots");
const AUDIT_PATH = join(SSOT_DIR, "governance/audit_ledger.json");

const kindToPath = {
  page_definition: "studio/pages/page_definitions.json",
  page_version: "studio/pages/page_instances.json",
  route_spec: "studio/routes/route_specs.json",
  nav_spec: "studio/nav/nav_specs.json",
  widget_instance: "studio/widgets/widget_instances.json",
  design_token: "design/design_tokens.json",
  theme: "design/themes.json",
  active_release: "changes/active_release.json",
  break_glass: "governance/break_glass.json",
  change_freeze: "governance/change_freeze.json"
};

const kindToSchema = {
  page_definition: "page_definition.v1",
  page_version: "page_version.v1",
  route_spec: "route_spec.v1",
  nav_spec: "array_of_objects.v1",
  widget_instance: "array_of_objects.v1",
  design_token: "design_token.v1",
  theme: "theme.v1",
  active_release: "active_release.v1",
  break_glass: "break_glass.v1",
  change_freeze: "change_freeze.v1"
};

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

function writeJson(path, data) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

function acquireLock() {
  if (existsSync(LOCK_PATH)) throw new Error("Changeset lock active");
  writeFileSync(LOCK_PATH, String(Date.now()));
}

function releaseLock() {
  if (existsSync(LOCK_PATH)) rmSync(LOCK_PATH);
}

function snapshot(label) {
  const id = `${label}-${Date.now()}`;
  const out = join(SNAPSHOT_DIR, id);
  mkdirSync(out, { recursive: true });
  copyDir(SSOT_DIR, out);
  return out;
}

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const s = join(src, entry.name);
    const d = join(dest, entry.name);
    if (s.includes("/changes/snapshots")) continue;
    if (entry.isDirectory()) copyDir(s, d);
    else writeFileSync(d, readFileSync(s));
  }
}

function checksumFile(path) {
  return sha256(readFileSync(path, "utf-8"));
}

function applyOp(dataArray, op) {
  if (!Array.isArray(dataArray)) {
    if (op.op === "update") {
      if (op.path) {
        dataArray[op.path] = op.value;
      } else {
        Object.assign(dataArray, op.value);
      }
      return;
    }
    throw new Error(`Unsupported op for object target: ${op.op}`);
  }
  const targetRef = op.target.ref;
  if (op.op === "add") {
    dataArray.push(op.value);
  } else if (op.op === "update") {
    const idx = dataArray.findIndex((x) => x.id === targetRef);
    if (idx < 0) throw new Error(`Target not found: ${targetRef}`);
    if (op.path) {
      dataArray[idx][op.path] = op.value;
    } else {
      dataArray[idx] = { ...dataArray[idx], ...op.value };
    }
  } else if (op.op === "rename") {
    const idx = dataArray.findIndex((x) => x.id === op.from);
    if (idx < 0) throw new Error(`Target not found: ${op.from}`);
    dataArray[idx].id = op.to;
  } else if (op.op === "deprecate") {
    const idx = dataArray.findIndex((x) => x.id === targetRef);
    if (idx < 0) throw new Error(`Target not found: ${targetRef}`);
    dataArray[idx].state = "deprecated";
  } else if (op.op === "delete_request") {
    // deletion is orchestrated separately
    return;
  } else {
    throw new Error(`Unsupported op: ${op.op}`);
  }
}

function readChangeset(changesetId) {
  const direct = join(SSOT_DIR, `changes/changesets/${changesetId}.json`);
  const legacy = join(SSOT_DIR, `changes/changesets/${changesetId}/changeset.json`);
  const path = existsSync(direct) ? direct : legacy;
  return { path, data: readJson(path) };
}

function appendAudit(entry) {
  const ledger = existsSync(AUDIT_PATH) ? readJson(AUDIT_PATH) : [];
  const prev = ledger.length ? ledger[ledger.length - 1].hash : "GENESIS";
  const payload = { ...entry, prev_hash: prev };
  const hash = sha256(stableStringify(payload));
  ledger.push({ ...payload, hash });
  writeJson(AUDIT_PATH, ledger);
}

export function applyOpsToDir(ssotDir, ops) {
  for (const op of ops || []) {
    const relPath = kindToPath[op.target.kind];
    if (!relPath) throw new Error(`Unsupported kind: ${op.target.kind}`);
    const absPath = join(ssotDir, relPath);
    const data = readJson(absPath);

    const expectedExists = op.preconditions?.expected_exists;
    if (expectedExists === false && data.some((x) => x.id === op.target.ref)) {
      throw new Error(`Target already exists: ${op.target.ref}`);
    }
    if (op.preconditions?.expected_version) {
      const item = data.find((x) => x.id === op.target.ref);
      if (!item || item.version !== op.preconditions.expected_version) {
        throw new Error(`Version mismatch for ${op.target.ref}`);
      }
    }

    applyOp(data, op);
    const schemaId = kindToSchema[op.target.kind];
    if (Array.isArray(data)) {
      if (schemaId === "array_of_objects.v1") validateOrThrow(schemaId, data, relPath);
      else for (const item of data) validateOrThrow(schemaId, item, relPath);
    } else {
      validateOrThrow(schemaId, data, relPath);
    }
    writeJson(absPath, data);
  }
}

export function applyChangeset(changesetId) {
  const { path: csPath, data: cs } = readChangeset(changesetId);
  if (cs.status !== "draft") throw new Error("Only draft changesets can be applied");

  acquireLock();
  let snapshotPath = "";
  try {
    snapshotPath = snapshot(`preapply-${changesetId}`);
    for (const op of cs.ops || []) {
      const relPath = kindToPath[op.target.kind];
      if (!relPath) throw new Error(`Unsupported kind: ${op.target.kind}`);
      const absPath = join(SSOT_DIR, relPath);
      const data = readJson(absPath);

      const expectedExists = op.preconditions?.expected_exists;
      const checksum = checksumFile(absPath);
      if (op.preconditions?.expected_checksum && op.preconditions.expected_checksum !== checksum) {
        throw new Error(`Checksum mismatch for ${relPath}`);
      }
      if (op.preconditions?.expected_version) {
        const item = data.find((x) => x.id === op.target.ref);
        if (!item || item.version !== op.preconditions.expected_version) {
          throw new Error(`Version mismatch for ${op.target.ref}`);
        }
      }
      if (expectedExists === false && data.some((x) => x.id === op.target.ref)) {
        throw new Error(`Target already exists: ${op.target.ref}`);
      }

      applyOp(data, op);

      const schemaId = kindToSchema[op.target.kind];
      if (Array.isArray(data)) {
        if (schemaId === "array_of_objects.v1") validateOrThrow(schemaId, data, relPath);
        else for (const item of data) validateOrThrow(schemaId, item, relPath);
      } else {
        validateOrThrow(schemaId, data, relPath);
      }

      const stagingPath = absPath + ".staging";
      writeJson(stagingPath, data);
      renameSync(stagingPath, absPath);
    }

    cs.status = "applied";
    cs.applied_at = new Date().toISOString();
    cs.snapshot_ref = snapshotPath;
    writeJson(csPath, cs);
    writeJson(join(SSOT_DIR, `changes/reviews/${cs.id}.json`), { id: cs.id, status: "pending", created_at: cs.applied_at });
    appendAudit({ event: "changeset_applied", changeset_id: cs.id, at: cs.applied_at });
    return cs;
  } catch (err) {
    if (snapshotPath) copyDir(snapshotPath, SSOT_DIR);
    throw err;
  } finally {
    releaseLock();
  }
}
