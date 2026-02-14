import { mkdirSync, writeFileSync } from "fs";

const kind = process.argv[2];
const ref = process.argv[3];
const redirectTo = process.argv[4] === "--redirect-to" ? process.argv[5] : "";
if (!kind || !ref) {
  console.error("Usage: request-delete.mjs <kind> <ref> [--redirect-to <path>] ");
  process.exit(1);
}

const id = `cs-${Date.now()}`;
mkdirSync("./platform/ssot/changes/changesets", { recursive: true });
const csPath = `./platform/ssot/changes/changesets/${id}.json`;
const cs = {
  id,
  status: "draft",
  created_by: "system",
  created_at: new Date().toISOString(),
  scope: "global",
  ops: [
    {
      op: "delete_request",
      target: { kind, ref },
      reason: "requested delete",
      preconditions: { expected_exists: true }
    }
  ]
};

writeFileSync(csPath, JSON.stringify(cs, null, 2) + "\n");
console.log(`Delete requested in changeset ${id}`);
if (redirectTo) console.log(`Redirect requested to ${redirectTo}`);
