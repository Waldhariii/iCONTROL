/**
 * Phase AA: minimal studio designer flow — create page/sections, preview, diff/impact.
 */
import { spawn } from "child_process";
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
    const pageId = `designer-min-${Date.now()}`;
    const page_definition = {
      id: pageId,
      surface: "cp",
      key: pageId,
      slug: pageId,
      title_key: "studio.designer_min",
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

    const previewRes = await fetch(`${api}/changesets/${cs.id}/preview`, { method: "POST", headers: authHeaders });
    if (!previewRes.ok) throw new Error("Preview failed: " + (await previewRes.text()));

    const diffRes = await fetch(`${api}/studio/diff/manifest?preview=${cs.id}`, { headers: authHeaders });
    if (!diffRes.ok) throw new Error("Diff failed: " + diffRes.status);
    const diffBody = await diffRes.json();
    if (!diffBody.diff || !Array.isArray(diffBody.diff.added)) throw new Error("Diff missing added");

    const impactRes = await fetch(`${api}/studio/impact?changeset=${cs.id}`, { headers: authHeaders });
    if (!impactRes.ok) throw new Error("Impact failed: " + impactRes.status);

    console.log("Studio designer flow min PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
