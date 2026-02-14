import { spawn } from "child_process";

const api = "http://localhost:7070/api";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const server = spawn("node", ["apps/backend-api/server.mjs"], { stdio: "inherit" });
  await sleep(500);

  try {
    // negative: missing role
    const forbidden = await fetch(`${api}/changesets`, { method: "POST" });
    if (forbidden.status === 200) throw new Error("Expected forbidden");

    // create changeset
    const cs = await fetch(`${api}/changesets`, {
      method: "POST",
      headers: { "x-role": "cp.admin" }
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
        capabilities_required: [],
        owner_team: "studio",
        tags: [],
        state: "active"
      },
      preconditions: { expected_exists: false }
    };

    await fetch(`${api}/changesets/${cs.id}/ops`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-role": "cp.admin" },
      body: JSON.stringify(op)
    });

    const fetched = await fetch(`${api}/changesets/${cs.id}`, { headers: { "x-role": "cp.admin" } }).then((r) => r.json());
    if (!fetched.id) throw new Error("Changeset fetch failed");

    console.log("API tests PASS");
  } finally {
    server.kill();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
