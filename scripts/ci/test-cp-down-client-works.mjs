import { spawn } from "child_process";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { createTempSsot, getS2SToken } from "./test-utils.mjs";
import { renderFromManifest } from "../../apps/client-app/renderer.mjs";

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
    const token = await getS2SToken({ baseUrl: "http://localhost:7070", principalId: "svc:cp", secret: "dummy", scopes: ["studio.*", "runtime.read", "release.*"] });
    const authHeaders = { authorization: `Bearer ${token}` };
    const cs = await fetch(`${api}/changesets`, { method: "POST", headers: authHeaders }).then((r) => r.json());
    const pageId = `client-cpdown-${Date.now()}`;
    const page_definition = {
      id: pageId,
      surface: "client",
      key: pageId,
      slug: pageId,
      title_key: "client.cpdown",
      module_id: "client",
      default_layout_template_id: "layout-1",
      capabilities_required: ["client.access"],
      owner_team: "client",
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
      headers: { "Content-Type": "application/json", ...authHeaders },
      body: JSON.stringify({ changeset_id: cs.id, page_definition, page_version })
    });
    const route_spec = {
      route_id: `route:${pageId}`,
      surface: "client",
      path: `/${pageId}`,
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

    const reviewsDir = join(temp.ssotDir, "changes/reviews");
    mkdirSync(reviewsDir, { recursive: true });
    writeFileSync(join(reviewsDir, `publish-${cs.id}.json`), JSON.stringify({ id: `publish-${cs.id}`, action: "publish", target_id: cs.id, required_approvals: 2, approvals: ["user:admin", "user:admin2"], status: "approved" }, null, 2));
    const published = await fetch(`${api}/changesets/${cs.id}/publish`, { method: "POST", headers: authHeaders }).then((r) => r.json());
    const releaseId = published.release_id;
    const manifest = await fetch(`${api}/runtime/manifest?release=${releaseId}`, { headers: authHeaders }).then((r) => r.json());
    renderFromManifest(manifest, `/${pageId}`);
    console.log("CP down, client works PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
