import { mkdirSync, writeFileSync } from "fs";

const id = process.argv[2] || `cs-${Date.now()}`;
mkdirSync("./platform/ssot/changes/changesets", { recursive: true });

const changeset = {
  id,
  status: "draft",
  created_by: "system",
  created_at: new Date().toISOString(),
  scope: "global",
  ops: []
};

const path = `./platform/ssot/changes/changesets/${id}.json`;
writeFileSync(path, JSON.stringify(changeset, null, 2) + "\n");
console.log(`Changeset created: ${path}`);
