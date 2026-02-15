import { spawn } from "child_process";
import { createTempSsot, getS2SToken } from "./test-utils.mjs";

/* IC_API_TEST_BOUND */
function __icParseBoundLine(line) {
  const m = String(line || "").match(/__IC_BOUND__=(\{.*\})/);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const temp = createTempSsot();
  const server = spawn("node", ["apps/backend-api/server.mjs"], {
    stdio: ["ignore", "pipe", "inherit"],
    env: {
      ...process.env,
      SSOT_DIR: temp.ssotDir,
      S2S_CP_HMAC: "dummy",
      S2S_TOKEN_SIGN: "dummy",
      CI: "true",
      HOST: "127.0.0.1",
      PORT: "0"
    }
  });

  let baseUrl = process.env.BASE_URL || "";
  const chunks = [];
  server.stdout.on("data", (chunk) => chunks.push(chunk));
  const deadline = Date.now() + 10000;
  while (!baseUrl && Date.now() < deadline) {
    await sleep(50);
    const out = Buffer.concat(chunks).toString("utf-8");
    for (const line of out.split(/\r?\n/)) {
      const bound = __icParseBoundLine(line);
      if (bound) {
        baseUrl = `http://${bound.host || "127.0.0.1"}:${bound.port || 7070}`;
        break;
      }
    }
  }
  if (!baseUrl) baseUrl = "http://127.0.0.1:7070";
  const api = `${baseUrl}/api`;

  await sleep(200);

  try {
    // negative: missing role
    const forbidden = await fetch(`${api}/changesets`, { method: "POST" });
    if (forbidden.status === 200) throw new Error("Expected forbidden");

    // create changeset
    const token = await getS2SToken({ baseUrl, principalId: "svc:cp", secret: "dummy", scopes: ["studio.*"] });
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
