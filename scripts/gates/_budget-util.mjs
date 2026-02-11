import fs from "fs";
import path from "path";

export function loadBudgets() {
  const p = path.join(process.cwd(), "runtime", "configs", "governance", "warn-budgets.json");
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  if (!j || !j.budgets) throw new Error("warn-budgets.json invalid");
  return { path: p, json: j };
}

export function failIfExceeds({ key, count, details, budgetMax }) {
  if (count > budgetMax) {
    console.error(`ERR_BUDGET_EXCEEDED:${key} count=${count} max=${budgetMax}`);
    for (const d of details) console.error(`- ${d}`);
    process.exit(1);
  }
  console.log(`OK: budget:${key} count=${count} max=${budgetMax}`);
}
