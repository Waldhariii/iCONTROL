import { spawn } from "child_process";

const api = "http://localhost:7070/api";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const server = spawn("node", ["apps/backend-api/server.mjs"], { stdio: "inherit" });
  await sleep(500);

  try {
    const cs = await fetch(`${api}/changesets`, { method: "POST", headers: { "x-role": "cp.admin" } }).then((r) => r.json());

    const pageId = `delete-test-${Date.now()}`;
    const page_definition = {
      id: pageId,
      surface: "cp",
      key: pageId,
      slug: pageId,
      title_key: "delete.test",
      module_id: "studio",
      default_layout_template_id: "layout-1",
      capabilities_required: [],
      owner_team: "studio",
      tags: [],
      state: "active"
    };

    const page_version = {
      page_id: pageId,
      version: "1.0.0",
      status: "draft",
      layout_instance_id: "layout-1",
      widget_instance_ids: [],
      nav_binding_ids: [],
      design_version_lock: "v1",
      checksum: "local",
      rollback_ref: "",
      created_by: "studio",
      created_at: new Date().toISOString(),
      diff_ref: ""
    };

    await fetch(`${api}/studio/pages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-role": "cp.admin" },
      body: JSON.stringify({ changeset_id: cs.id, page_definition, page_version })
    });

    await fetch(`${api}/changesets/${cs.id}/publish`, { method: "POST", headers: { "x-role": "cp.admin" } });

    const csDelete = await fetch(`${api}/changesets`, { method: "POST", headers: { "x-role": "cp.admin" } }).then((r) => r.json());
    await fetch(`${api}/studio/pages/${pageId}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json", "x-role": "cp.admin" },
      body: JSON.stringify({ changeset_id: csDelete.id })
    });

    console.log("Delete flow PASS");
  } finally {
    server.kill();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
