import { readFileSync, existsSync, mkdirSync, copyFileSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";
import { loadManifest } from "../../platform/runtime/loader/loader.mjs";
import { sha256, stableStringify } from "../../platform/compilers/utils.mjs";
import {
  ensurePacksDir,
  ensureDir,
  writeJson,
  collectChecksums,
  signPackJson,
  writeReport,
  scanPackForSecrets,
  resolveReportsDir
} from "./release-pack-utils.mjs";

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--release") out.release = args[++i];
    else if (a === "--env") out.env = args[++i];
    else if (a === "--out") out.out = args[++i];
    else if (a === "--include-evidence") out.includeEvidence = true;
    else if (a === "--no-include-evidence") out.includeEvidence = false;
    else if (a === "--include-assets") out.includeAssets = true;
    else if (a === "--no-include-assets") out.includeAssets = false;
  }
  return out;
}

function readActiveRelease(ssotDir) {
  const path = join(ssotDir, "changes", "active_release.json");
  if (!existsSync(path)) return { active_release_id: "", active_env: "dev" };
  return JSON.parse(readFileSync(path, "utf-8"));
}

function copyManifestFiles({ releaseId, manifestsDir, outDir }) {
  const entries = readdirSync(manifestsDir).filter((f) => f.includes(`.${releaseId}.`));
  const manifestOut = join(outDir, "manifests");
  mkdirSync(manifestOut, { recursive: true });
  const copied = [];
  for (const file of entries) {
    const src = join(manifestsDir, file);
    const dest = join(manifestOut, file);
    copyFileSync(src, dest);
    copied.push(dest);
  }
  const buildDir = manifestsDir.includes("/runtime/manifests")
    ? manifestsDir.replace(/\/runtime\/manifests$/, "/platform/runtime/build_artifacts")
    : `${manifestsDir}/build_artifacts`;
  const themeVars = join(buildDir, `theme_vars.${releaseId}.css`);
  if (existsSync(themeVars)) {
    const dest = join(manifestOut, `theme_vars.${releaseId}.css`);
    copyFileSync(themeVars, dest);
    copied.push(dest);
  }
  return { manifestOut, copied };
}

function writeCompatSnapshot(manifest, outDir) {
  const compatPath = join(outDir, "snapshots", "compat.json");
  ensureDir(join(outDir, "snapshots"));
  writeJson(compatPath, manifest.compat || {});
  return compatPath;
}

function writeEvidenceSnapshots(manifest, outDir) {
  const evidenceDir = join(outDir, "evidence");
  ensureDir(evidenceDir);
  const security = {
    secret_bindings_summary: manifest.security?.secret_bindings_summary || [],
    policies_summary: manifest.security?.policies_summary || [],
    s2s_summary: manifest.security?.s2s_summary || {}
  };
  const securityPath = join(evidenceDir, "security_posture.json");
  writeJson(securityPath, security);

  const sloPath = join(evidenceDir, "slo_snapshot.json");
  writeJson(sloPath, {
    slo_definitions: manifest.sre?.slo_definitions || [],
    error_budget_policies: manifest.sre?.error_budget_policies || []
  });

  const gatesPath = join(evidenceDir, "gates_snapshot.json");
  writeJson(gatesPath, { generated_at: new Date().toISOString() });

  return [securityPath, sloPath, gatesPath];
}

function copyAssets(manifest, outDir) {
  const assets = manifest.assets || [];
  if (!Array.isArray(assets) || assets.length === 0) return [];
  const assetsDir = join(outDir, "assets");
  ensureDir(assetsDir);
  const copied = [];
  for (const asset of assets) {
    const src = asset.path || asset;
    if (!src || !existsSync(src)) continue;
    const dest = join(assetsDir, basename(src));
    copyFileSync(src, dest);
    copied.push(dest);
  }
  return copied;
}

function copyExtensionArtifacts(manifestsDir, outDir) {
  const extDir = manifestsDir.includes("/runtime/manifests") ? manifestsDir.replace(/\/runtime\/manifests$/, "/runtime/extensions") : `${manifestsDir}/extensions`;
  if (!existsSync(extDir)) return [];
  const out = join(outDir, "extensions");
  ensureDir(out);
  const copied = [];
  for (const f of readdirSync(extDir)) {
    if (!f.endsWith(".signed.json")) continue;
    const src = join(extDir, f);
    const dest = join(out, f);
    copyFileSync(src, dest);
    copied.push(dest);
  }
  return copied;
}

async function main() {
  const args = parseArgs();
  const ssotDir = process.env.SSOT_DIR || "./platform/ssot";
  const manifestsDir = process.env.MANIFESTS_DIR || "./runtime/manifests";
  const active = readActiveRelease(ssotDir);
  const releaseId = args.release || active.active_release_id;
  const env = args.env || active.active_env || "dev";
  if (!releaseId) throw new Error("Missing release id");

  const manifest = loadManifest({ releaseId, manifestsDir, stalenessMs: 0 });
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const packsDir = ensurePacksDir();
  const outDir = args.out || join(packsDir, `PACK_${ts}_${releaseId}`);
  ensureDir(outDir);

  const { manifestOut } = copyManifestFiles({ releaseId, manifestsDir, outDir });
  const manifestPath = join(manifestOut, `platform_manifest.${releaseId}.json`);
  const manifestSigPath = join(manifestOut, `platform_manifest.${releaseId}.sig`);

  const compatPath = writeCompatSnapshot(manifest, outDir);
  const evidencePaths = args.includeEvidence === false ? [] : writeEvidenceSnapshots(manifest, outDir);
  const assetPaths = args.includeAssets === false ? [] : copyAssets(manifest, outDir);
  const extensionArtifacts = copyExtensionArtifacts(manifestsDir, outDir);

  const packJson = {
    pack_version: "1",
    created_at: new Date().toISOString(),
    created_by: "system",
    release_id: releaseId,
    env,
    manifest: {
      path: `manifests/platform_manifest.${releaseId}.json`,
      sha256: sha256(readFileSync(manifestPath, "utf-8")),
      signature: existsSync(manifestSigPath) ? readFileSync(manifestSigPath, "utf-8").trim() : ""
    },
    checksums: [],
    compat_snapshot: { path: "snapshots/compat.json", sha256: sha256(readFileSync(compatPath, "utf-8")) },
    evidence_snapshot: evidencePaths.map((p) => ({
      path: `evidence/${basename(p)}`,
      sha256: sha256(readFileSync(p, "utf-8"))
    })),
    optional_assets: [
      ...assetPaths.map((p) => ({
        path: `assets/${basename(p)}`,
        sha256: sha256(readFileSync(p, "utf-8"))
      })),
      ...extensionArtifacts.map((p) => ({
        path: `extensions/${basename(p)}`,
        sha256: sha256(readFileSync(p, "utf-8"))
      }))
    ],
    provenance: {
      git_head: process.env.GIT_HEAD || "",
      tags: [],
      build_host: process.env.HOSTNAME || ""
    }
  };

  const packJsonPath = join(outDir, "pack.json");
  writeJson(packJsonPath, packJson);
  const checksums = collectChecksums(outDir, ["pack.sig", "pack.json"]);
  packJson.checksums = checksums;
  writeJson(packJsonPath, packJson);

  const privKey = "./platform/runtime/keys/manifest-private.pem";
  const sigPath = join(outDir, "pack.sig");
  signPackJson(packJsonPath, privKey, sigPath);

  scanPackForSecrets([outDir]);

  const reportPath = writeReport(
    `RELEASE_PACK_REPORT_${ts}.md`,
    [
      `Release Pack: ${releaseId}`,
      `Env: ${env}`,
      `Path: ${outDir}`,
      `Files: ${checksums.length}`,
      `Signature: ${sigPath}`
    ].join("\n")
  );

  resolveReportsDir();
  console.log(`Release pack written: ${outDir}`);
  console.log(`Report: ${reportPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
