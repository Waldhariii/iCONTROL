import { spawn } from "child_process";
import { createTempSsot } from "./test-utils.mjs";

const api = "http://localhost:7070/api";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function run() {
  const temp = createTempSsot();
  const server = spawn("node", ["apps/backend-api/server.mjs"], { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir } });
  await sleep(500);

  try {
    const cs = await fetch(`${api}/changesets`, { method: "POST", headers: { "x-role": "cp.admin" } }).then((r) => r.json());

    const pageId = `studio-test-${Date.now()}`;
    const page_definition = {
      id: pageId,
      surface: "cp",
      key: pageId,
      slug: pageId,
      title_key: "studio.test",
      module_id: "studio",
      default_layout_template_id: "layout-1",
      capabilities_required: ["studio.access"],
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

    const route_spec = {
      route_id: `route:${pageId}`,
      surface: "cp",
      path: `/cp/studio/pages/${pageId}`,
      page_id: pageId,
      guard_pack_id: "guard:default",
      flag_gate_id: "flag:default",
      entitlement_gate_id: "entitlement:default",
      priority: 10,
      canonical: true,
      aliases: [],
      deprecation_date: "",
      redirect_to: ""
    };
    await fetch(`${api}/studio/routes`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-role": "cp.admin" },
      body: JSON.stringify({ changeset_id: cs.id, route_spec })
    });

    await fetch(`${api}/studio/nav`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-role": "cp.admin" },
      body: JSON.stringify({ changeset_id: cs.id, nav_spec: { id: `nav-${pageId}`, route_id: route_spec.route_id } })
    });

    const previewRes = await fetch(`${api}/changesets/${cs.id}/preview`, { method: "POST", headers: { "x-role": "cp.admin" } });
    if (!previewRes.ok) {
      const txt = await previewRes.text();
      throw new Error(`Preview failed: ${txt}`);
    }
    const validateRes = await fetch(`${api}/changesets/${cs.id}/validate`, { method: "POST", headers: { "x-role": "cp.admin" } });
    if (!validateRes.ok) throw new Error("Validate failed");

    const published = await fetch(`${api}/changesets/${cs.id}/publish`, {
      method: "POST",
      headers: { "x-role": "cp.admin" }
    }).then((r) => r.json());

    if (!published.release_id) throw new Error("Missing release_id");
    console.log("Studio flow PASS", published.release_id);
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
