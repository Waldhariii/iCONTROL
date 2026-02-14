import { readFileSync, readdirSync } from "fs";
import { join, dirname } from "path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const strict = process.env.STRICT_SCHEMA === "1";
const ajv = new Ajv2020({
  allErrors: true,
  strict,
  logger: strict
    ? {
        log: () => {},
        warn: (msg) => {
          throw new Error(`Schema warning treated as error: ${msg}`);
        },
        error: console.error
      }
    : undefined
});
addFormats(ajv);
let initialized = false;

function loadSchemas() {
  if (initialized) return;
  const indexPath = join(process.cwd(), "core/contracts/schemas-index.json");
  let index;
  try {
    index = JSON.parse(readFileSync(indexPath, "utf-8"));
  } catch {
    index = buildIndexFallback();
  }

  for (const [schemaId, relPath] of Object.entries(index)) {
    const absPath = join(process.cwd(), relPath);
    const schema = JSON.parse(readFileSync(absPath, "utf-8"));
    ajv.addSchema(schema, schemaId);
  }
  initialized = true;
}

function buildIndexFallback() {
  const base = join(process.cwd(), "core/contracts/schemas");
  const files = readdirSync(base);
  const index = {};
  for (const f of files) {
    if (!f.endsWith(".schema.json")) continue;
    const abs = join(base, f);
    const schema = JSON.parse(readFileSync(abs, "utf-8"));
    if (!schema.$id) continue;
    index[schema.$id] = `core/contracts/schemas/${f}`;
  }
  return index;
}

export function validateOrThrow(schemaId, data, ctx = "") {
  loadSchemas();
  const validate = ajv.getSchema(schemaId);
  if (!validate) {
    throw new Error(`Schema not found: ${schemaId}`);
  }
  const ok = validate(data);
  if (!ok) {
    const details = validate.errors?.map((e) => `${e.instancePath} ${e.message}`).join("; ") || "unknown";
    throw new Error(`Schema validation failed (${schemaId}) ${ctx ? `[${ctx}]` : ""}: ${details}`);
  }
  return true;
}
