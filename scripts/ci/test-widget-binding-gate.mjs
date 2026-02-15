import { widgetBindingGate } from "../../governance/gates/gates.mjs";

const res = widgetBindingGate({ ssotDir: "./platform/ssot" });
if (!res.ok) throw new Error(res.details || "Widget binding gate failed");
console.log("Widget binding gate PASS");
