import { readdirSync, statSync, readFileSync } from "fs";
import { join } from "path";
import { validateOrThrow } from "./validate.mjs";

const specificMap = new Map([
  ["page_definitions.json", "page_definition.v1"],
  ["page_instances.json", "page_version.v1"],
  ["route_specs.json", "route_spec.v1"],
  ["design_tokens.json", "design_token.v1"],
  ["themes.json", "theme.v1"]
]);

function inferSchemaForFile(path, data) {
  const base = path.split("/").slice(-1)[0];
  if (specificMap.has(base)) return specificMap.get(base);
  if (Array.isArray(data) && data.every((x) => typeof x === "string")) return "array_of_strings.v1";
  return "array_of_objects.v1";
}

export function validateSsotDir(ssotDir) {
  function walk(dir) {
    const entries = readdirSync(dir);
    for (const e of entries) {
      const p = join(dir, e);
      const st = statSync(p);
      if (st.isDirectory()) walk(p);
      else if (e.endsWith(".json")) validateFile(p);
    }
  }

  function validateFile(path) {
    const data = JSON.parse(readFileSync(path, "utf-8"));
    const schemaId = inferSchemaForFile(path, data);
    if (Array.isArray(data) && schemaId !== "array_of_objects.v1" && schemaId !== "array_of_strings.v1") {
      for (const item of data) validateOrThrow(schemaId, item, path);
      return;
    }
    validateOrThrow(schemaId, data, path);
  }

  walk(ssotDir);
  return true;
}
