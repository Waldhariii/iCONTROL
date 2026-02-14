import { readdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";

const base = join(process.cwd(), "core/contracts/schemas");
const files = readdirSync(base);
const index = {};

for (const f of files) {
  if (!f.endsWith(".schema.json")) continue;
  const abs = join(base, f);
  const schema = JSON.parse(readFileSync(abs, "utf-8"));
  if (!schema.$id) {
    console.error(`Missing $id in ${f}`);
    process.exit(1);
  }
  index[schema.$id] = `core/contracts/schemas/${f}`;
}

writeFileSync(join(process.cwd(), "core/contracts/schemas-index.json"), JSON.stringify(index, null, 2) + "\n");
console.log("schemas-index.json generated");
