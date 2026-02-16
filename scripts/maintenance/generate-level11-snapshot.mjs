/**
 * Level 11: Immutable architectural snapshot — forensic baseline.
 * Writes runtime/reports/LEVEL11_ARCH_SNAPSHOT.json and runtime/reports/index/level11_latest.jsonl.
 */
import { readFileSync, existsSync, mkdirSync, writeFileSync, appendFileSync, readdirSync } from "fs";
import { join } from "path";
import { createHash } from "crypto";

const root = process.cwd();
const releaseId = process.env.RELEASE_ID || process.argv[2] || "dev-001";
const reportsDir = join(root, "runtime", "reports");
const indexDir = join(reportsDir, "index");

function sha256(content) {
  return createHash("sha256").update(String(content)).digest("hex");
}

function hashFile(path) {
  if (!existsSync(path)) return null;
  return sha256(readFileSync(path, "utf-8"));
}

function hashFiles(dir, ext = ".mjs") {
  if (!existsSync(dir)) return null;
  const files = readdirSync(dir)
    .filter((f) => f.endsWith(ext))
    .sort();
  const concat = files.map((f) => readFileSync(join(dir, f), "utf-8")).join("\n");
  return sha256(concat);
}

const manifestsDir = join(root, "runtime", "manifests");
const manifestFiles = existsSync(manifestsDir)
  ? readdirSync(manifestsDir)
    .filter((f) => f.endsWith(".json") && f.includes(releaseId))
    .sort()
  : [];
const manifestFingerprint = manifestFiles.length
  ? sha256(manifestFiles.map((f) => readFileSync(join(manifestsDir, f), "utf-8")).join("\n"))
  : null;

const gatesDir = join(root, "governance", "gates");
const gatesChecksum = hashFiles(gatesDir, ".mjs");

const adaptersDir = join(root, "platform", "runtime", "adapters");
let adaptersHash = hashFile(join(adaptersDir, "registry.mjs"));
if (adaptersHash && existsSync(join(adaptersDir, "adapters"))) {
  const adapterFiles = readdirSync(join(adaptersDir, "adapters"))
    .filter((f) => f.endsWith(".mjs"))
    .sort();
  const adapterContent = adapterFiles
    .map((f) => readFileSync(join(adaptersDir, "adapters", f), "utf-8"))
    .join("\n");
  adaptersHash = sha256(adaptersHash + adapterContent);
}

const workflowDefPath = join(root, "platform", "ssot", "studio", "workflows", "workflow_definitions.json");
const workflowRegistryHash = hashFile(workflowDefPath);

const tenantFactoryPath = join(root, "platform", "runtime", "tenancy", "factory.mjs");
const provisionerPath = join(root, "platform", "runtime", "tenancy", "provisioner.mjs");
const tenantFactoryHash = sha256(
  [tenantFactoryPath, provisionerPath]
    .filter((p) => existsSync(p))
    .map((p) => readFileSync(p, "utf-8"))
    .join("\n")
);

const EXTENSION_SDK_VERSION = "1.0.0";

let gaCorrelationId = null;
const gaPath = join(reportsDir, "index", "ga_latest.jsonl");
if (existsSync(gaPath)) {
  const lines = readFileSync(gaPath, "utf-8").trim().split("\n").filter(Boolean);
  if (lines.length) {
    try {
      const last = JSON.parse(lines[lines.length - 1]);
      gaCorrelationId = last.correlation_id || null;
    } catch {}
  }
}

const snapshot = {
  release_id: releaseId,
  generated_at: new Date().toISOString(),
  manifest_fingerprint: manifestFingerprint,
  gates_checksum: gatesChecksum,
  adapters_registry_hash: adaptersHash,
  workflow_registry_hash: workflowRegistryHash,
  tenant_factory_hash: tenantFactoryHash,
  extension_sdk_version: EXTENSION_SDK_VERSION,
  ga_readiness_correlation_id: gaCorrelationId
};

mkdirSync(indexDir, { recursive: true });
const snapshotPath = join(reportsDir, "LEVEL11_ARCH_SNAPSHOT.json");
writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2) + "\n", "utf-8");

const indexEntry = {
  ts: new Date().toISOString(),
  release_id: releaseId,
  snapshot_path: "LEVEL11_ARCH_SNAPSHOT.json",
  correlation_id: gaCorrelationId
};
appendFileSync(
  join(reportsDir, "index", "level11_latest.jsonl"),
  JSON.stringify(indexEntry) + "\n",
  "utf-8"
);

console.log("LEVEL11_ARCH_SNAPSHOT.json written to runtime/reports/");
console.log("level11_latest.jsonl index updated");
