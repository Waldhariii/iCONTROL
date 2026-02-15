import { execSync } from "child_process";
import { readdirSync, statSync, existsSync } from "fs";
import { join } from "path";
import { getReportsDir } from "./test-utils.mjs";

execSync("node scripts/maintenance/generate-evidence-pack.mjs", { stdio: "inherit" });

const evidenceRoot = join(getReportsDir(), "evidence");
if (!existsSync(evidenceRoot)) throw new Error("Evidence root missing");
const dirs = readdirSync(evidenceRoot)
  .map((d) => ({ d, t: statSync(join(evidenceRoot, d)).mtimeMs }))
  .filter((x) => statSync(join(evidenceRoot, x.d)).isDirectory())
  .sort((a, b) => b.t - a.t);
const latest = dirs[0]?.d;
if (!latest) throw new Error("No evidence pack found");
const outDir = join(evidenceRoot, latest);
const required = ["marketplace_events.json", "billing_draft_events.json", "ops_events.json", "policy_decisions.json"];
for (const f of required) {
  const p = join(outDir, f);
  if (!existsSync(p)) throw new Error(`Missing evidence file: ${f}`);
}
console.log("Evidence pack observability sections PASS");
