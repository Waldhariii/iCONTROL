/**
 * Phase AB: designer sections/tabs flow — temp SSOT, changeset, add tab + section, preview, verify sections_v2 and no-tabs-routes.
 */
import { spawn, execSync } from "child_process";
import { readFileSync, mkdirSync, existsSync, rmSync } from "fs";
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
    const pageId = `designer-sections-${Date.now()}`;
    const w1 = `w-${pageId}-tab1`;
    const w2 = `w-${pageId}-main`;

    const page_definition = {
      id: pageId,
      surface: "cp",
      key: pageId,
      slug: pageId,
      title_key: "studio.designer_sections",
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
      widget_instance_ids: [w1, w2],
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
      body: JSON.stringify({ changeset_id: cs.id, page_definition, page_version })
    });

    await fetch(`${api}/studio/nav`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        changeset_id: cs.id,
        nav_spec: {
          id: `nav-${pageId}-tab1`,
          surface: "cp",
          module_id: "studio",
          type: "section",
          page_id: pageId,
          section_key: "tab1",
          label: "Tab 1",
          order: 0
        }
      })
    });

    await fetch(`${api}/studio/widgets`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        changeset_id: cs.id,
        widget_instance: {
          id: w1,
          widget_id: "widget:placeholder",
          props: {},
          props_schema: { allowed_props: [] },
          page_id: pageId,
          module_id: "studio",
          section_key: "tab1"
        }
      })
    });
    await fetch(`${api}/studio/widgets`, {
      method: "POST",
      headers: authHeaders,
      body: JSON.stringify({
        changeset_id: cs.id,
        widget_instance: {
          id: w2,
          widget_id: "widget:placeholder",
          props: {},
          props_schema: { allowed_props: [] },
          page_id: pageId,
          module_id: "studio",
          section_key: "main"
        }
      })
    });

    const previewRes = await fetch(`${api}/changesets/${cs.id}/preview`, { method: "POST", headers: authHeaders });
    if (!previewRes.ok) throw new Error("Preview failed: " + (await previewRes.text()));

    const manifestsDir = join(previewDir, csId, "manifests");
    if (!existsSync(manifestsDir)) throw new Error("Preview manifests dir missing");
    const releaseId = `preview-${csId}`;
    const renderPath = join(manifestsDir, `render_graph.${releaseId}.json`);
    if (!existsSync(renderPath)) throw new Error("render_graph missing");
    const renderGraph = readJson(renderPath);

    if (!Array.isArray(renderGraph.sections_v2)) throw new Error("render_graph missing sections_v2");
    const forPage = renderGraph.sections_v2.find((ps) => ps.page_id === pageId);
    if (!forPage || !forPage.sections?.length) throw new Error("sections_v2 missing page or sections");

    const hasTab = forPage.sections.some((s) => s.kind === "tab");
    const hasSection = forPage.sections.some((s) => s.kind === "section");
    if (!hasTab) throw new Error("sections_v2 must include kind=tab");
    if (!hasSection) throw new Error("sections_v2 must include kind=section");

    const routeCatalogPath = join(manifestsDir, `route_catalog.${releaseId}.json`);
    if (existsSync(routeCatalogPath)) {
      const routeCatalog = readJson(routeCatalogPath);
      const routes = routeCatalog.routes || [];
      const sectionKeys = new Set(forPage.sections.map((s) => s.key));
      const tabRoutes = routes.filter((r) => {
        const segs = (r.path || "").split("/").filter(Boolean);
        const last = segs[segs.length - 1];
        return last && sectionKeys.has(last);
      });
      if (tabRoutes.length > 0) {
        throw new Error(`Tabs must not be routes. Found: ${tabRoutes.map((r) => r.path).join(", ")}`);
      }
    }

    execSync(`node governance/gates/run-gates.mjs ${releaseId}`, {
      stdio: "inherit",
      env: {
        ...process.env,
        SSOT_DIR: join(previewDir, csId, "ssot"),
        MANIFESTS_DIR: manifestsDir
      }
    });

    console.log("Designer sections/tabs flow PASS");
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
