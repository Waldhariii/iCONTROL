import { readFileSync } from "fs";

const widgets = JSON.parse(readFileSync("./platform/ssot/studio/widgets/widget_instances.json", "utf-8"));
for (const w of widgets) {
  const allowed = new Set((w.props_schema && w.props_schema.allowed_props) || []);
  const props = w.props || {};
  for (const key of Object.keys(props)) {
    if (!allowed.has(key)) {
      throw new Error(`Widget ${w.id} has disallowed prop: ${key}`);
    }
  }
}
console.log("Domain widgets safe PASS");
