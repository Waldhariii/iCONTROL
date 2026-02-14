import { applyChangeset } from "./patch-engine.mjs";

const id = process.argv[2];
if (!id) {
  console.error("Missing changeset id");
  process.exit(1);
}

try {
  const cs = applyChangeset(id);
  console.log(`Changeset applied: ${cs.id}`);
} catch (err) {
  console.error(String(err.message || err));
  process.exit(2);
}
