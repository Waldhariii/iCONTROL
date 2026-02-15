/**
 * Phase Z: smoke test for studio diff engine.
 * Creates changeset, compiles preview, fetches diff, asserts non-empty delta shape.
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
    const pageId = `diff-smoke-${Date.now()}`;
    const page_definition = {
      id: pageId,
      surface: "cp",
      key: pageId,
      slug: pageId,
      title_key: "studio.diff_smoke",
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
      path: `/cp/diff-smoke/${pageId}`,
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
    if (!diffRes.ok) {
      const txt = await diffRes.text();
      throw new Error(`Diff manifest failed: ${diffRes.status} ${txt}`);
    }
    const diffBody = await diffRes.json();
    if (!diffBody.diff || !Array.isArray(diffBody.diff.added) || !Array.isArray(diffBody.diff.removed) || !Array.isArray(diffBody.diff.changed)) {
      throw new Error("Diff response missing added/removed/changed arrays");
    }
    if (!diffBody.active_release || !diffBody.preview_release) {
      throw new Error("Diff response missing active_release or preview_release");
    }
    const totalDelta = diffBody.diff.added.length + diffBody.diff.removed.length + diffBody.diff.changed.length;
    if (totalDelta === 0) {
      throw new Error("Expected non-empty delta (added/removed/changed); got 0");
    }

    console.log("Diff engine smoke PASS", { added: diffBody.diff.added.length, removed: diffBody.diff.removed.length, changed: diffBody.diff.changed.length });
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
