import { spawn } from "child_process";
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
    // negative: missing role
    const forbidden = await fetch(`${api}/changesets`, { method: "POST" });
    if (forbidden.status === 200) throw new Error("Expected forbidden");

    // create changeset
    const token = await getS2SToken({ baseUrl: "http://localhost:7070", principalId: "svc:cp", secret: "dummy", scopes: ["studio.*"] });
    const authHeaders = { authorization: `Bearer ${token}` };

    const cs = await fetch(`${api}/changesets`, {
      method: "POST",
      headers: authHeaders
    }).then((r) => r.json());

    const op = {
      op: "add",
      target: { kind: "page_definition", ref: "api-page" },
      value: {
        id: "api-page",
        surface: "cp",
        key: "api-page",
        slug: "api-page",
        title_key: "api.page",
        module_id: "studio",
        default_layout_template_id: "layout-1",
        capabilities_required: ["studio.access"],
        owner_team: "studio",
        tags: [],
        state: "active"
      },
      preconditions: { expected_exists: false }
    };

    await fetch(`${api}/changesets/${cs.id}/ops`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify(op)
    });

    const fetched = await fetch(`${api}/changesets/${cs.id}`, { headers: authHeaders }).then((r) => r.json());
    if (!fetched.id) throw new Error("Changeset fetch failed");

    console.log("API tests PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
