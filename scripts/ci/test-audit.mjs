import { readFileSync } from "fs";
import { sha256, stableStringify } from "../../platform/compilers/utils.mjs";

const path = "./platform/ssot/governance/audit_ledger.json";
const ledger = JSON.parse(readFileSync(path, "utf-8"));
let prev = "GENESIS";
for (const entry of ledger) {
  const payload = { ...entry };
  const hash = payload.hash;
  delete payload.hash;
  if (payload.prev_hash !== prev) throw new Error("Audit chain broken");
  const computed = sha256(stableStringify(payload));
  if (computed !== hash) throw new Error("Audit hash mismatch");
  prev = hash;
}
console.log("Audit ledger PASS");
