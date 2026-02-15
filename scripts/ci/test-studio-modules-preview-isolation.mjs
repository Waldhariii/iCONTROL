import { spawn } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
import { createTempSsot, getS2SToken } from "./test-utils.mjs";

const api = "http://localhost:7070/api";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const temp = createTempSsot();
  const server = spawn("node", ["apps/backend-api/server.mjs"], {
    stdio: "inherit",
    env: { ...process.env, SSOT_DIR: temp.ssotDir, S2S_CP_HMAC: "dummy", S2S_TOKEN_SIGN: "dummy" }
  });
  await sleep(500);

  try {
    const activePath = join(temp.ssotDir, "changes", "active_release.json");
    const before = JSON.parse(readFileSync(activePath, "utf-8"));

    const token = await getS2SToken({ baseUrl: "http://localhost:7070", principalId: "svc:cp", secret: "dummy", scopes: ["studio.*"] });
    const authHeaders = { authorization: `Bearer ${token}` };
    const cs = await fetch(`${api}/changesets`, { method: "POST", headers: authHeaders }).then((r) => r.json());

    const module = {
      module_id: `module:preview-${Date.now()}`,
      name: "Preview Module",
      tier: "free",
      surfaces: ["client"],
      provides: { pages: [], routes: [], nav: [], widgets: [], forms: [], workflows: [], datasources: [] },
      required_capabilities: ["client.access"],
      default_entitlements: ["entitlement:default"],
      dependencies: ["platform:datasource"]
    };

    await fetch(`${api}/studio/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ changeset_id: cs.id, module })
    });

    const previewRes = await fetch(`${api}/changesets/${cs.id}/preview`, { method: "POST", headers: authHeaders });
    if (!previewRes.ok) throw new Error("Preview failed");

    const after = JSON.parse(readFileSync(activePath, "utf-8"));
    if (before.active_release_id !== after.active_release_id) throw new Error("Active release changed during preview");

    console.log("Studio modules preview isolation PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
