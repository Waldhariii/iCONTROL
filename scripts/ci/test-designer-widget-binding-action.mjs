/**
 * Phase AB: designer widget + binding + action — temp SSOT, widget with data_bindings and action (policy_id), preview, run gates.
 */
import { spawn, execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync, rmSync, mkdirSync } from "fs";
import { join } from "path";
import { createTempSsot, getS2SToken } from "./test-utils.mjs";

const api = "http://localhost:7070/api";
const ROOT = process.cwd();

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function readJson(p) {
  return JSON.parse(readFileSync(p, "utf-8"));
}

async function run() {
  const temp = createTempSsot();
  const server = spawn("node", ["apps/backend-api/server.mjs"], {
    stdio: "inherit",
    env: { ...process.env, SSOT_DIR: temp.ssotDir, S2S_CP_HMAC: "dummy", S2S_TOKEN_SIGN: "dummy" }
  });
  await sleep(500);

  const previewDir = join(ROOT, "platform", "runtime", "preview");
  let csId = null;
  try {
    const token = await getS2SToken({ baseUrl: "http://localhost:7070", principalId: "svc:cp", secret: "dummy", scopes: ["studio.*"] });
    const authHeaders = { "Content-Type": "application/json", authorization: `Bearer ${token}` };

    const cs = await fetch(`${api}/changesets`, { method: "POST", headers: authHeaders }).then((r) => r.json());
    csId = cs.id;

    const queryOp = {
      op: "add",
      target: { kind: "query_catalog", ref: "query:designer-binding-test" },
      value: {
        query_id: "query:designer-binding-test",
        datasource_id: "ds:primary",
        name: "Designer Binding Test",
        module_id: "studio"
      },
      preconditions: { expected_exists: false }
    };
    const budgetOp = {
      op: "add",
      target: { kind: "query_budget", ref: "query:designer-binding-test" },
      value: {
        query_id: "query:designer-binding-test",
        tier: "free",
        max_ms: 1000,
        cache_policy_id: "cache:default"
      },
      preconditions: { expected_exists: false }
    };
    const csPath = join(temp.ssotDir, "changes", "changesets", `${csId}.json`);
    mkdirSync(join(temp.ssotDir, "changes", "changesets"), { recursive: true });
    const csBody = readJson(csPath);
    csBody.ops.unshift(budgetOp, queryOp);
    writeFileSync(csPath, JSON.stringify(csBody, null, 2) + "\n");

    const pageId = `designer-binding-${Date.now()}`;
    const w1 = `w-${pageId}-sec1`;

    const page_definition = {
      id: pageId,
      surface: "cp",
      key: pageId,
      slug: pageId,
      title_key: "studio.designer_binding",
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
      widget_instance_ids: [w1],
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
      headers: authHeaders,
      body: JSON.stringify({ changeset_id: csId, page_definition, page_version })
    });

    await fetch(`${api}/studio/widgets`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        changeset_id: csId,
        widget_instance: {
          id: w1,
          widget_id: "widget:placeholder",
          props: {},
          props_schema: { allowed_props: [] },
          page_id: pageId,
          module_id: "studio",
          section_key: "__default",
          data_bindings: [
            { binding_id: "b1", datasource_id: "ds:primary", query_id: "query:designer-binding-test" }
          ],
          actions: [
            { action_id: "a1", kind: "navigate", policy_id: "policy:default" }
          ]
        }
      })
    });

    const previewRes = await fetch(`${api}/changesets/${csId}/preview`, { method: "POST", headers: authHeaders });
    if (!previewRes.ok) throw new Error("Preview failed: " + (await previewRes.text()));

    const releaseId = `preview-${csId}`;
    const manifestsDir = join(previewDir, csId, "manifests");
    const ssotDir = join(previewDir, csId, "ssot");
    if (!existsSync(manifestsDir)) throw new Error("Preview manifests dir missing");

    execSync(`node governance/gates/run-gates.mjs ${releaseId}`, {
      stdio: "inherit",
      env: { ...process.env, SSOT_DIR: ssotDir, MANIFESTS_DIR: manifestsDir }
    });

    console.log("Designer widget binding action PASS");
  } finally {
    server.kill();
    if (csId && existsSync(join(previewDir, csId))) {
      rmSync(join(previewDir, csId), { recursive: true, force: true });
    }
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
