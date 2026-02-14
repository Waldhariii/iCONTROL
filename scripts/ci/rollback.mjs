import { rollback } from "../../platform/runtime/release/orchestrator.mjs";

const releaseId = process.argv[2];
const reason = process.argv[3] || "manual";
if (!releaseId) {
  console.error("Usage: rollback.mjs <releaseId> [reason]");
  process.exit(1);
}

rollback(releaseId, reason);
console.log(`Rolled back ${releaseId}`);
