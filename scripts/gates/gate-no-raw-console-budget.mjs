import { execSync } from "child_process";
import { loadBudgets, failIfExceeds } from "./_budget-util.mjs";

const { json } = loadBudgets();
const key = "no-raw-console";
const max = json.budgets[key]?.max ?? 0;

let out = "";
try { out = execSync("npm run -s gate:no-raw-console", { stdio: "pipe", encoding: "utf8" }); }
catch (e) { out = (e.stdout?.toString?.() ?? "") + "\n" + (e.stderr?.toString?.() ?? ""); }

const offenders = out.split("\n").filter(l => l.startsWith("- ")).map(l => l.slice(2).trim()).filter(Boolean);
failIfExceeds({ key, count: offenders.length, details: offenders, budgetMax: max });
