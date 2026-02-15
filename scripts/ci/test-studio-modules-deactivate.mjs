import { spawn } from "child_process";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { createTempSsot } from "./test-utils.mjs";

const api = "http://localhost:7070/api";

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function writeReview(ssotDir, name, action, targetId) {
  const dir = join(ssotDir, "changes", "reviews");
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), JSON.stringify({ id: name, action, target_id: targetId, required_approvals: 2, approvals: ["user:admin", "user:admin2"], status: "approved" }, null, 2));
}

function reviewFilename(action, targetId) {
  const safe = action.replace(/[^a-z0-9-]/gi, "_");
  return `${safe}-${targetId}.json`;
}

async function run() {
  const temp = createTempSsot();
  const server = spawn("node", ["apps/backend-api/server.mjs"], { stdio: "inherit", env: { ...process.env, SSOT_DIR: temp.ssotDir } });
  await sleep(500);

  try {
    const cs = await fetch(`${api}/changesets`, { method: "POST", headers: { "x-role": "cp.admin" } }).then((r) => r.json());

    const pageId = `client-demo-${Date.now()}`;
    const page_definition = {
      id: pageId,
      surface: "client",
      key: pageId,
      slug: pageId,
      title_key: "demo",
      module_id: "module:demo",
      default_layout_template_id: "layout-1",
      capabilities_required: ["client.access"],
      owner_team: "demo",
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
      surface: "client",
      path: `/demo/${pageId}`,
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
      body: JSON.stringify({ changeset_id: cs.id, nav_spec: { id: `nav-${pageId}`, surface: "client", label: "Demo", path: route_spec.path, module_id: "module:demo" } })
    });

    const module = {
      module_id: "module:demo",
      name: "Demo Module",
      tier: "free",
      surfaces: ["client"],
      provides: { pages: [pageId], routes: [route_spec.route_id], nav: [`nav-${pageId}`], widgets: [], forms: [], workflows: [], datasources: [] },
      required_capabilities: ["client.access"],
      default_entitlements: ["entitlement:default"],
      dependencies: ["platform:datasource"]
    };

    await fetch(`${api}/studio/modules`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-role": "cp.admin" },
      body: JSON.stringify({ changeset_id: cs.id, module })
    });

    const previewRes = await fetch(`${api}/changesets/${cs.id}/preview`, { method: "POST", headers: { "x-role": "cp.admin" } });
    if (!previewRes.ok) throw new Error("Preview failed");
    const validateRes = await fetch(`${api}/changesets/${cs.id}/validate`, { method: "POST", headers: { "x-role": "cp.admin" } });
    if (!validateRes.ok) throw new Error("Validate failed");

    writeReview(temp.ssotDir, reviewFilename("publish", cs.id), "publish", cs.id);

    const publishRes = await fetch(`${api}/studio/modules/${module.module_id}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-role": "cp.admin" },
      body: JSON.stringify({ changeset_id: cs.id })
    });
    if (!publishRes.ok) throw new Error("Publish failed");

    const activateCs = `cs-activate-${Date.now()}`;
    writeReview(temp.ssotDir, reviewFilename("activate", activateCs), "activate", activateCs);

    const activateRes = await fetch(`${api}/studio/modules/${module.module_id}/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-role": "cp.admin" },
      body: JSON.stringify({ tenant_id: "tenant:default", changeset_id: activateCs })
    });
    if (!activateRes.ok) {
      const txt = await activateRes.text();
      throw new Error(`Activate failed: ${txt}`);
    }

    const deactivateCs = `cs-deactivate-${Date.now()}`;
    writeReview(temp.ssotDir, reviewFilename("activate", deactivateCs), "activate", deactivateCs);

    const deactivateRes = await fetch(`${api}/studio/modules/${module.module_id}/deactivate`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-role": "cp.admin" },
      body: JSON.stringify({ tenant_id: "tenant:default", changeset_id: deactivateCs })
    });
    if (!deactivateRes.ok) {
      const txt = await deactivateRes.text();
      throw new Error(`Deactivate failed: ${txt}`);
    }

    const manifest = await fetch(`${api}/runtime/manifest`, { headers: { "x-role": "cp.admin" } }).then((r) => r.json());
    const routes = (manifest.routes?.routes || []).map((r) => r.path);
    if (routes.includes(route_spec.path)) throw new Error("Module route still present after deactivate");

    console.log("Studio modules deactivate PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
