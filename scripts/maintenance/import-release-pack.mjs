import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from "fs";
import { join, dirname } from "path";
import { execSync } from "child_process";
import { loadManifest } from "../../platform/runtime/loader/loader.mjs";
import {
  ensureDir,
  validatePackSchema,
  verifyPackJson,
  verifyChecksums,
  scanPackForSecrets,
  appendJsonl,
  resolveReportsDir,
  pickLatestPackDir
} from "./release-pack-utils.mjs";

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { mode: "staging", requireS2S: true };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--pack") out.pack = args[++i];
    else if (a === "--mode") out.mode = args[++i];
    else if (a === "--staging-id") out.stagingId = args[++i];
    else if (a === "--require-s2s") out.requireS2S = true;
    else if (a === "--no-require-s2s") out.requireS2S = false;
  }
  return out;
}

function readPack(packPath) {
  const p = packPath.endsWith("pack.json") ? packPath : join(packPath, "pack.json");
  if (!existsSync(p)) throw new Error(`Missing pack.json at ${p}`);
  return { packPath: p, packDir: dirname(p), data: JSON.parse(readFileSync(p, "utf-8")) };
}

function compatCheck(packCompat, ssotDir) {
  const path = join(ssotDir, "compat", "compatibility_matrix.json");
  if (!existsSync(path)) return true;
  const current = JSON.parse(readFileSync(path, "utf-8"));
  const packEntries = packCompat.compatibility_matrix || [];
  const currentEntries = current || [];
  for (const entry of packEntries) {
    const match = currentEntries.find((e) => e.from_version === entry.from_version && e.to_version === entry.to_version);
    if (!match || match.allowed === false) {
      throw new Error(`Compat mismatch: ${entry.from_version} -> ${entry.to_version}`);
    }
  }
  return true;
}

function copyManifestToStaging(packDir, releaseId, stagingId) {
  const baseManifests = process.env.MANIFESTS_DIR || "./runtime/manifests";
  const importDir = join(baseManifests, "imports", stagingId);
  ensureDir(importDir);
  const manifestDir = join(packDir, "manifests");
  for (const f of readdirSync(manifestDir)) {
    if (f.includes(`.${releaseId}.`)) {
      copyFileSync(join(manifestDir, f), join(importDir, f));
    }
  }
  const extDir = join(packDir, "extensions");
  if (existsSync(extDir)) {
    const extOut = join(importDir, "extensions");
    ensureDir(extOut);
    for (const f of readdirSync(extDir)) {
      copyFileSync(join(extDir, f), join(extOut, f));
    }
  }
  return importDir;
}

function writeImportIndex(entry) {
  const reportsDir = resolveReportsDir();
  const idx = join(reportsDir, "index", "imports.jsonl");
  appendJsonl(idx, entry);
  return idx;
}

async function main() {
  const args = parseArgs();
  const ssotDir = process.env.SSOT_DIR || "./platform/ssot";
  const manifestsDir = process.env.MANIFESTS_DIR || "./runtime/manifests";
  const packDir = args.pack || pickLatestPackDir();
  if (!packDir) throw new Error("No pack dir provided or found");
  const { packPath, data: pack } = readPack(packDir);
  validatePackSchema(pack);

  const sigOk = verifyPackJson(packPath, "./platform/runtime/keys/manifest-public.pem", join(dirname(packPath), "pack.sig"));
  if (!sigOk) throw new Error("Pack signature invalid");

  verifyChecksums(dirname(packPath), pack.checksums || []);
  scanPackForSecrets([dirname(packPath)]);

  const compatPath = join(dirname(packPath), pack.compat_snapshot.path);
  const compat = JSON.parse(readFileSync(compatPath, "utf-8"));
  compatCheck(compat, ssotDir);

  const stagingId = args.stagingId || `import-${Date.now()}`;
  const stagingDir = copyManifestToStaging(dirname(packPath), pack.release_id, stagingId);
  loadManifest({ releaseId: pack.release_id, manifestsDir: stagingDir, stalenessMs: 0 });

  writeImportIndex({
    ts: new Date().toISOString(),
    request_id: `import-${Date.now()}`,
    staging_id: stagingId,
    release_id: pack.release_id,
    pack_path: dirname(packPath),
    mode: args.mode
  });

  if (args.mode === "activate") {
    execSync(`node governance/gates/run-gates.mjs ${pack.release_id}`, {
      stdio: "inherit",
      env: { ...process.env, SSOT_DIR: ssotDir, MANIFESTS_DIR: stagingDir }
    });
    const changesetId = `cs-pack-activate-${Date.now()}`;
    const csPath = join(ssotDir, "changes", "changesets", `${changesetId}.json`);
    const payload = {
      id: changesetId,
      status: "draft",
      created_by: "system",
      created_at: new Date().toISOString(),
      scope: "platform:*",
      ops: [
        {
          op: "update",
          target: { kind: "active_release", ref: "active_release" },
          value: { active_release_id: pack.release_id, active_env: pack.env, updated_at: new Date().toISOString(), updated_by: "import-release-pack" },
          reason: "Activate release pack"
        }
      ]
    };
    writeFileSync(csPath, JSON.stringify(payload, null, 2) + "\n", "utf-8");
    execSync(`node scripts/ci/apply-changeset.mjs ${changesetId}`, { stdio: "inherit" });
  }

  console.log(`Imported pack staging: ${stagingId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
