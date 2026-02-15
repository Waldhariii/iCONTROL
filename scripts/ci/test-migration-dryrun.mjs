import { planUpgrade, dryRun } from "../../platform/runtime/migrations/engine.mjs";

const plan = planUpgrade({ from: "1.0.0", to: "1.1.0" });
const report = dryRun(plan);
if (!report) throw new Error("Dry-run report missing");
console.log("Migration dry-run PASS");
