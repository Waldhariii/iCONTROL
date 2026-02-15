import { mkdirSync, writeFileSync, existsSync, readFileSync, readdirSync, copyFileSync } from "fs";
import { join } from "path";
import { execSync } from "child_process";

const SSOT_DIR = process.env.SSOT_DIR || "./platform/ssot";
const RUNTIME_DIR = process.env.RUNTIME_DIR || join(SSOT_DIR, "..", "runtime");
const ts = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = join(RUNTIME_DIR, "reports", "evidence", ts);
mkdirSync(outDir, { recursive: true });

function copyIfExists(src, dest) {
  if (existsSync(src)) copyFileSync(src, dest);
}

const tags = execSync("git tag --list", { encoding: "utf-8" }).trim();
writeFileSync(join(outDir, "tags.txt"), tags + "\n", "utf-8");
const head = execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
writeFileSync(join(outDir, "HEAD.txt"), head + "\n", "utf-8");

copyIfExists(join(RUNTIME_DIR, "reports", "CI_REPORT.md"), join(outDir, "CI_REPORT.md"));
copyIfExists("./governance/gates/gates-report.md", join(outDir, "gates-report.md"));
copyIfExists("./platform/runtime/drift/drift-report.md", join(outDir, "drift-report.md"));

copyIfExists(join(SSOT_DIR, "sre", "slo_definitions.json"), join(outDir, "slo_definitions.json"));
copyIfExists(join(SSOT_DIR, "sre", "error_budget_policies.json"), join(outDir, "error_budget_policies.json"));
copyIfExists(join(SSOT_DIR, "sre", "canary_policies.json"), join(outDir, "canary_policies.json"));

const activePath = join(SSOT_DIR, "changes", "active_release.json");
if (existsSync(activePath)) {
  const active = JSON.parse(readFileSync(activePath, "utf-8"));
  const releaseId = active.active_release_id;
  if (releaseId) {
    const checksums = join(RUNTIME_DIR, "manifests", `checksums.${releaseId}.json`);
    copyIfExists(checksums, join(outDir, `checksums.${releaseId}.json`));
  }
}

const summary = [
  `Evidence pack ${ts}`,
  `HEAD: ${head}`,
  `Tags: ${tags.split("\n").slice(-5).join(", ")}`
];
writeFileSync(join(outDir, "SUMMARY.md"), summary.join("\n") + "\n", "utf-8");

console.log(`Evidence pack generated: ${outDir}`);
