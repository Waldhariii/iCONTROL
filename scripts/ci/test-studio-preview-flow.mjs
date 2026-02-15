/**
 * Phase Z: studio preview flow — create changeset, compile preview, fetch diff and impact, assert non-empty delta.
 */
import { spawn } from "child_process";
import { writeFileSync, mkdirSync } from "fs";
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
    const token = await getS2SToken({ baseUrl: "http://localhost:7070", principalId: "svc:cp", secret: "dummy", scopes: ["studio.*"] });
    const authHeaders = { authorization: `Bearer ${token}` };

    const cs = await fetch(`${api}/changesets`, { method: "POST", headers: authHeaders }).then((r) => r.json());
    const pageId = `preview-flow-${Date.now()}`;
    const page_definition = {
      id: pageId,
      surface: "cp",
      key: pageId,
      slug: pageId,
      title_key: "studio.preview_flow",
      module_id: "studio",
      default_layout_template_id: "layout-1",
      capabilities_required: ["studio.access"],
      owner_team: "studio",
      tags: [],
      state: "active"
    };
    const page_version = {
      page_id: pageId,
      module_id: "studio",
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
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ changeset_id: cs.id, page_definition, page_version })
    });
    const route_spec = {
      route_id: `route:${pageId}`,
      surface: "cp",
      path: `/cp/preview-flow/${pageId}`,
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
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ changeset_id: cs.id, route_spec })
    });
    await fetch(`${api}/studio/nav`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({
        changeset_id: cs.id,
        nav_spec: { id: `nav-${pageId}`, surface: "cp", module_id: "studio", type: "link", label: pageId, path: route_spec.path }
      })
    });

    const previewRes = await fetch(`${api}/changesets/${cs.id}/preview`, { method: "POST", headers: authHeaders });
    if (!previewRes.ok) {
      const txt = await previewRes.text();
      throw new Error(`Preview failed: ${txt}`);
    }

    const diffRes = await fetch(`${api}/studio/diff/manifest?preview=${cs.id}`, { headers: authHeaders });
    if (!diffRes.ok) throw new Error(`Diff failed: ${diffRes.status}`);
    const diffBody = await diffRes.json();
    const totalDelta = diffBody.diff.added.length + diffBody.diff.removed.length + diffBody.diff.changed.length;
    if (totalDelta === 0) throw new Error("Expected non-empty delta");

    const impactRes = await fetch(`${api}/studio/impact?changeset=${cs.id}`, { headers: authHeaders });
    if (!impactRes.ok) throw new Error(`Impact failed: ${impactRes.status}`);
    const impactBody = await impactRes.json();
    if (!impactBody.impact || typeof impactBody.impact.breaking !== "boolean") {
      throw new Error("Impact response missing impact.breaking");
    }

    console.log("Studio preview flow PASS", { delta: totalDelta, breaking: impactBody.impact.breaking });
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
