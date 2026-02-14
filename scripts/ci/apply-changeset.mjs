import { applyChangeset } from "../../platform/runtime/changes/patch-engine.mjs";

const id = process.argv[2];
if (!id) {
  console.error("Usage: apply-changeset.mjs <id>");
  process.exit(1);
}

applyChangeset(id);
console.log(`Applied changeset ${id}`);
