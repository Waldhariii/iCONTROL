import { execSync } from "child_process";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";
import { writeReport, rotateReports, writeIndexLine, assertNoForbiddenReportPaths } from "./report-utils.mjs";
import { pickLatestPackDir } from "./release-pack-utils.mjs";

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { ciSafe: false, skipInstall: false, skipCi: false };
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--ci-safe") {
      out.ciSafe = true;
      out.skipInstall = true;
      out.skipCi = true;
    } else if (args[i] === "--skip-install") out.skipInstall = true;
    else if (args[i] === "--skip-ci") out.skipCi = true;
  }
  return out;
}

function run(cmd) {
  execSync(cmd, { stdio: "inherit" });
}

function readActiveRelease() {
  const path = join(process.cwd(), "platform", "ssot", "changes", "active_release.json");
  if (!existsSync(path)) return { active_release_id: "", active_env: "" };
  return JSON.parse(readFileSync(path, "utf-8"));
}

function gitHead() {
  try {
    return execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

function gitTags() {
  try {
    return execSync("git tag --points-at HEAD", { encoding: "utf-8" }).trim();
  } catch {
    return "";
  }
}

function countDirs(path) {
  if (!existsSync(path)) return 0;
  return readdirSync(path, { withFileTypes: true }).filter((e) => e.isDirectory()).length;
}

async function main() {
  const args = parseArgs();

  assertNoForbiddenReportPaths();
  run("node -v");
  run("pnpm -v");

  if (!args.skipInstall) run("pnpm -s install");
  run("node scripts/maintenance/generate-keys.mjs");
  run("node scripts/maintenance/generate-schemas-index.mjs");

  // Deep clean dry-run + cap-only prune if budgets exceeded
  run("APPLY=0 CAP_ONLY=0 scripts/maintenance/deep-clean-v5.sh");
  const previewCount = countDirs(join(process.cwd(), "platform", "runtime", "preview"));
  const snapCount = countDirs(join(process.cwd(), "platform", "ssot", "changes", "snapshots"));
  if (previewCount > 200 || snapCount > 200) {
    run("CAP_ONLY=1 KEEP_PREVIEW_COUNT=50 KEEP_SNAP_COUNT=150 APPLY=1 scripts/maintenance/deep-clean-v5.sh");
  }

  if (!args.skipCi) run("node scripts/ci/ci-all.mjs");

  run("node scripts/maintenance/generate-evidence-pack.mjs");
  run("node scripts/maintenance/generate-release-pack.mjs");

  const latestPack = pickLatestPackDir();
  if (!latestPack) throw new Error("No release pack found");

  run(`node scripts/maintenance/verify-pack-offline.mjs --pack ${latestPack}`);
  run(`node scripts/maintenance/dr-drill-from-pack.mjs --pack ${latestPack}`);

  const active = readActiveRelease();
  const summary = [
    "# Bootstrap Summary",
    `active_release_id: ${active.active_release_id || ""}`,
    `active_env: ${active.active_env || ""}`,
    `git_head: ${gitHead()}`,
    `git_tags: ${gitTags()}`,
    `ci_report: runtime/reports/CI_REPORT.md`,
    `latest_pack: ${latestPack}`,
    `evidence_latest: runtime/reports/evidence/ (latest)`,
    `offline_verify: OK`,
    `dr_drill: OK`
  ].join("\n");

  const reportPath = writeReport("BOOTSTRAP_SUMMARY", summary);
  rotateReports("BOOTSTRAP_SUMMARY", 20);
  writeIndexLine("bootstrap_runs", {
    ts: new Date().toISOString(),
    report_path: reportPath,
    active_release_id: active.active_release_id || "",
    pack_path: latestPack
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
