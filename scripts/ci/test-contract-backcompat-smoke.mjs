import { planUpgrade } from "../../platform/runtime/migrations/engine.mjs";

const plan = planUpgrade({ from: "1.0.0", to: "1.1.0" });
if (!plan || plan.from_version !== "1.0.0") throw new Error("Backcompat plan missing");
console.log("Contract backcompat smoke PASS");
