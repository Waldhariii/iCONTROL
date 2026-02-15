import { readFileSync } from "fs";
import { validateOrThrow } from "../../core/contracts/schema/validate.mjs";

const file = process.argv[2];
if (!file) {
  console.error("Usage: validate-module.mjs <module.json>");
  process.exit(1);
}

const data = JSON.parse(readFileSync(file, "utf-8"));
validateOrThrow("domain_module.v1", data, file);

const deps = data.dependencies || [];
const invalid = deps.filter((d) => !String(d).startsWith("platform:"));
if (invalid.length) {
  console.error(`Invalid dependencies (must be platform:*): ${invalid.join(", ")}`);
  process.exit(1);
}

console.log("Module validation PASS");
