/**
 * Phase AF: Storage adapter — local FS sandbox under artifacts_dir. No external egress.
 */
import { writeFileSync, readFileSync, mkdirSync, existsSync } from "fs";
import { join, resolve, relative } from "path";

const KIND_WRITE = "storage.write";
const KIND_READ = "storage.read";

/** Soft quota per artifact (10MB). */
const MAX_ARTIFACT_BYTES = 10 * 1024 * 1024;

function safePath(baseDir, relativePath) {
  const p = String(relativePath || "").replace(/\.\./g, "");
  if (p.includes("..")) throw new Error("Path escape forbidden");
  const baseResolved = resolve(baseDir);
  const normalized = resolve(baseResolved, p);
  const rel = relative(baseResolved, normalized);
  if (rel.startsWith("..") || rel.includes("..")) throw new Error("Path escape forbidden");
  return normalized;
}

/**
 * @param {import("../types.mjs").AdapterContext} ctx
 */
async function runWrite(ctx) {
  const path = typeof ctx.inputs.path === "string" ? ctx.inputs.path : "out.json";
  const content = ctx.inputs.content !== undefined ? JSON.stringify(ctx.inputs.content) : "{}";
  const artifactsDir = ctx.artifacts_dir || ctx.inputs.artifacts_dir;
  if (!artifactsDir) return { ok: true, step_id: "storage.write", kind: KIND_WRITE, artifact_ids: [] };
  const fullPath = safePath(artifactsDir, path);
  const contentBytes = Buffer.byteLength(content, "utf-8");
  if (contentBytes > MAX_ARTIFACT_BYTES) return { ok: false, step_id: "storage.write", kind: KIND_WRITE, error: "Artifact quota exceeded" };
  mkdirSync(join(fullPath, ".."), { recursive: true });
  if (ctx.dry_run) return { ok: true, step_id: "storage.write", kind: KIND_WRITE, artifact_ids: [path] };
  writeFileSync(fullPath, content, "utf-8");
  return { ok: true, step_id: "storage.write", kind: KIND_WRITE, artifact_ids: [path] };
}

/**
 * @param {import("../types.mjs").AdapterContext} ctx
 */
async function runRead(ctx) {
  const path = typeof ctx.inputs.path === "string" ? ctx.inputs.path : "out.json";
  const artifactsDir = ctx.artifacts_dir || ctx.inputs.artifacts_dir;
  if (!artifactsDir) return { ok: true, step_id: "storage.read", kind: KIND_READ, content: null };
  const fullPath = safePath(artifactsDir, path);
  if (ctx.dry_run) return { ok: true, step_id: "storage.read", kind: KIND_READ, content: null };
  if (!existsSync(fullPath)) return { ok: false, step_id: "storage.read", kind: KIND_READ, error: "File not found" };
  const content = readFileSync(fullPath, "utf-8");
  return { ok: true, step_id: "storage.read", kind: KIND_READ, content };
}

export const storageWrite = {
  kind: KIND_WRITE,
  version: "1.0.0",
  capabilities: ["fs.write"],
  run: runWrite
};

export const storageRead = {
  kind: KIND_READ,
  version: "1.0.0",
  capabilities: ["fs.read"],
  run: runRead
};
