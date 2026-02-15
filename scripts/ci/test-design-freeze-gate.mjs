import { writeFileSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import { createTempSsot } from "./test-utils.mjs";
import { designFreezeGate } from "../../governance/gates/gates.mjs";

const temp = createTempSsot();
const ssotDir = temp.ssotDir;

try {
  const freezePath = join(ssotDir, "governance", "change_freeze.json");
  const freeze = JSON.parse(readFileSync(freezePath, "utf-8"));
  freeze.enabled = true;
  freeze.allow_actions = (freeze.allow_actions || []).filter((a) => !a.startsWith("design."));
  freeze.scopes = { ...(freeze.scopes || {}), content_mutations: true };
  writeFileSync(freezePath, JSON.stringify(freeze, null, 2) + "\n");

  const csDir = join(ssotDir, "changes", "changesets");
  mkdirSync(csDir, { recursive: true });
  const cs = {
    id: "cs-design-freeze-test",
    status: "draft",
    created_by: "test",
    created_at: new Date().toISOString(),
    scope: "global",
    ops: [
      {
        op: "update",
        target: { kind: "design_token", ref: "color.bg" },
        value: { value: "#ffffff" }
      }
    ]
  };
  writeFileSync(join(csDir, "cs-design-freeze-test.json"), JSON.stringify(cs, null, 2));

  const res = designFreezeGate({ ssotDir });
  if (res.ok) throw new Error("Design Freeze Gate should fail on design mutation");
  console.log("Design freeze gate PASS");
} finally {
  temp.cleanup();
}
