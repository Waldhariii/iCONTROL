/**
 * Phase AC.5: deterministic compile — compile twice with distinct OUT_DIR, assert identical fingerprint.
 */
import { execSync } from "child_process";
import { readFileSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { createTempSsot } from "./test-utils.mjs";
import { manifestFingerprint } from "../../platform/compilers/manifest-stable.mjs";

const temp = createTempSsot();
const ssotDir = temp.ssotDir;
const baseOut = join(dirname(dirname(ssotDir)), "runtime", "manifests");
const out1 = join(baseOut, "run1");
const out2 = join(baseOut, "run2");
mkdirSync(out1, { recursive: true });
mkdirSync(out2, { recursive: true });

execSync("node scripts/ci/compile.mjs dev-001 dev", {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: out1 }
});
execSync("node scripts/ci/compile.mjs dev-001 dev", {
  stdio: "inherit",
  env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: out2 }
});

const manifest1 = JSON.parse(readFileSync(join(out1, "platform_manifest.dev-001.json"), "utf-8"));
const manifest2 = JSON.parse(readFileSync(join(out2, "platform_manifest.dev-001.json"), "utf-8"));

const fp1 = manifest1?.meta?.fingerprint?.sha256;
const fp2 = manifest2?.meta?.fingerprint?.sha256;
if (!fp1 || !fp2) throw new Error("Manifest missing meta.fingerprint.sha256");
if (fp1 !== fp2) throw new Error(`Fingerprint mismatch: ${fp1} vs ${fp2}`);

const computed1 = manifestFingerprint(manifest1);
const computed2 = manifestFingerprint(manifest2);
if (computed1 !== computed2) throw new Error("Computed fingerprints differ between runs");
if (computed1 !== fp1) throw new Error("Stored fingerprint does not match recomputed hash from loaded manifest");

console.log("Manifest determinism PASS", { fingerprint: fp1 });
temp.cleanup();
