import { spawn } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const icontrolRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(icontrolRoot, "..");

const ARCHIVES_ROOT = path.join(workspaceRoot, "_ARCHIVES", "ui-preview");
const ROUTES_APP_PATH = path.join(ARCHIVES_ROOT, "routes_app.txt");
const ROUTES_CP_PATH = path.join(ARCHIVES_ROOT, "routes_cp.txt");

const HOST = process.env.ICONTROL_LOCAL_HOST || "127.0.0.1";
const BASE_PORT = process.env.ICONTROL_LOCAL_PORT || "4176";
const PORT_FILE = process.env.ICONTROL_LOCAL_PORT_FILE || "/tmp/icontrol-local-web.port";

const THEMES = ["dark", "light"];
const ROLES = ["USER", "SYSADMIN"];

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function timestampDir() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}${mm}${dd}_${hh}${min}`;
}

function sanitizeRoute(route) {
  return route
    .replace(/^\/+/, "")
    .replace(/[?#]/g, "_")
    .replace(/[^a-zA-Z0-9._-]+/g, "_");
}

async function readRoutes(filePath) {
  const raw = await fsp.readFile(filePath, "utf8");
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function runCommand(cmd, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: "inherit",
      ...options,
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited with ${code}`));
    });
  });
}

async function runPortGuard(env) {
  await runCommand("bash", ["scripts/port-guard.sh"], { cwd: icontrolRoot, env });
  try {
    const next = await fsp.readFile(PORT_FILE, "utf8");
    return next.trim() || BASE_PORT;
  } catch {
    return BASE_PORT;
  }
}

function waitForServer(baseUrl, timeoutMs = 90000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.request(`${baseUrl}/app/`, { method: "GET" }, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) {
          resolve();
        } else {
          retry();
        }
      });
      req.on("error", retry);
      req.end();
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error("Server did not respond in time"));
        return;
      }
      setTimeout(tick, 750);
    };
    tick();
  });
}

async function ensureDir(p) {
  await fsp.mkdir(p, { recursive: true });
}

async function copyRoutes(outputDir) {
  await fsp.copyFile(ROUTES_APP_PATH, path.join(outputDir, "routes_app.txt"));
  await fsp.copyFile(ROUTES_CP_PATH, path.join(outputDir, "routes_cp.txt"));
}

function groupEntries(entries) {
  const grouped = {};
  for (const entry of entries) {
    const { surface, theme, role } = entry;
    grouped[surface] ||= {};
    grouped[surface][theme] ||= {};
    grouped[surface][theme][role] ||= [];
    grouped[surface][theme][role].push(entry);
  }
  return grouped;
}

function renderIndex(entries, outputDir) {
  const grouped = groupEntries(entries);
  const sections = [];
  for (const surface of Object.keys(grouped)) {
    sections.push(`<h1>${surface.toUpperCase()}</h1>`);
    for (const theme of Object.keys(grouped[surface])) {
      sections.push(`<h2>${theme}</h2>`);
      for (const role of Object.keys(grouped[surface][theme])) {
        sections.push(`<h3>${role}</h3>`);
        sections.push('<div class="grid">');
        for (const item of grouped[surface][theme][role]) {
          const rel = path
            .relative(outputDir, item.filePath)
            .split(path.sep)
            .join("/");
          const label = item.route;
          sections.push(
            `<a class="thumb" href="${rel}"><img src="${rel}" alt="${label}"><span>${label}</span></a>`
          );
        }
        sections.push("</div>");
      }
    }
  }

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>iCONTROL UI Preview</title>
    <style>
      :root {
        color-scheme: light dark;
      }
      body {
        margin: 24px;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "SF Pro Display", Segoe UI, Roboto, Helvetica, Arial, sans-serif;
        background: #f6f6f4;
        color: #1b1b1b;
      }
      h1 {
        margin: 28px 0 8px;
        font-size: 28px;
      }
      h2 {
        margin: 20px 0 8px;
        font-size: 22px;
      }
      h3 {
        margin: 16px 0 6px;
        font-size: 18px;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
        gap: 16px;
        margin-bottom: 24px;
      }
      .thumb {
        display: block;
        text-decoration: none;
        color: inherit;
        border: 1px solid #d7d7d2;
        border-radius: 10px;
        overflow: hidden;
        background: #ffffff;
        box-shadow: 0 8px 20px rgba(0,0,0,.08);
      }
      .thumb img {
        display: block;
        width: 100%;
        height: auto;
        background: #111;
      }
      .thumb span {
        display: block;
        padding: 10px 12px 12px;
        font-size: 12px;
        line-height: 1.4;
        word-break: break-all;
      }
      @media (prefers-color-scheme: dark) {
        body {
          background: #121212;
          color: #f1f1f1;
        }
        .thumb {
          border-color: #2a2a2a;
          background: #1b1b1b;
        }
      }
    </style>
  </head>
  <body>
    ${sections.join("\n")}
  </body>
</html>`;

  return html;
}

async function main() {
  if (!fs.existsSync(ROUTES_APP_PATH) || !fs.existsSync(ROUTES_CP_PATH)) {
    throw new Error("Routes files missing. Expected _ARCHIVES/ui-preview/routes_app.txt and routes_cp.txt.");
  }

  const timestamp = timestampDir();
  const outputDir = path.join(ARCHIVES_ROOT, timestamp);
  await ensureDir(outputDir);
  await copyRoutes(outputDir);

  const env = {
    ...process.env,
    ICONTROL_LOCAL_HOST: HOST,
    ICONTROL_LOCAL_PORT: BASE_PORT,
    ICONTROL_LOCAL_PORT_FILE: PORT_FILE,
  };

  const port = await runPortGuard(env);
  env.ICONTROL_LOCAL_PORT = port;
  const baseUrl = `http://${HOST}:${port}`;

  log(`UI_PREVIEW: building local web dist...`);
  await runCommand("npm", ["run", "-s", "local:web:build"], { cwd: icontrolRoot, env });

  log(`UI_PREVIEW: starting local server at ${baseUrl}`);
  const server = spawn("npm", ["run", "-s", "local:web:serve"], {
    cwd: icontrolRoot,
    env,
    stdio: "inherit",
  });

  const stopServer = () => {
    if (!server.killed) {
      server.kill("SIGTERM");
    }
  };

  process.on("SIGINT", () => {
    stopServer();
    process.exit(1);
  });
  process.on("SIGTERM", () => {
    stopServer();
    process.exit(1);
  });

  try {
    await waitForServer(baseUrl);
    const routesApp = await readRoutes(ROUTES_APP_PATH);
    const routesCp = await readRoutes(ROUTES_CP_PATH);

    const browser = await chromium.launch({ headless: true });
    const entries = [];

    for (const surface of ["app", "cp"]) {
      const routes = surface === "app" ? routesApp : routesCp;
      const sessionKey = surface === "app" ? "icontrol_session_v1" : "icontrol_mgmt_session_v1";

      for (const theme of THEMES) {
        for (const role of ROLES) {
          const context = await browser.newContext({
            viewport: { width: 1440, height: 900 },
            deviceScaleFactor: 1,
          });

          await context.addInitScript(
            ({ sessionKey, role, theme }) => {
              try {
                localStorage.setItem(sessionKey, JSON.stringify({
                  username: `preview_${role.toLowerCase()}`,
                  role,
                  issuedAt: Date.now(),
                }));
              } catch {}
              try {
                localStorage.setItem("controlx_settings_v1.theme", theme);
              } catch {}
            },
            { sessionKey, role, theme }
          );

          const page = await context.newPage();
          await page.emulateMedia({ colorScheme: theme });
          page.setDefaultTimeout(60000);

          const targetDir = path.join(outputDir, surface, theme, role);
          await ensureDir(targetDir);

          for (const route of routes) {
            const fullUrl = `${baseUrl}${route}`;
            const filename = `route__${sanitizeRoute(route)}.png`;
            const filePath = path.join(targetDir, filename);

            try {
              await page.goto(fullUrl, { waitUntil: "networkidle" });
              await page.waitForTimeout(800);
            } catch (err) {
              log(`WARN: failed to load ${fullUrl}: ${err}`);
            }

            await page.screenshot({ path: filePath, fullPage: true });
            entries.push({ surface, theme, role, route, filePath });
          }

          await context.close();
        }
      }
    }

    await browser.close();

    const indexHtml = renderIndex(entries, outputDir);
    const indexPath = path.join(outputDir, "INDEX.html");
    await fsp.writeFile(indexPath, indexHtml, "utf8");

    log(`UI_PREVIEW_DONE: ${indexPath}`);
  } finally {
    stopServer();
  }
}

main().catch((err) => {
  console.error("UI_PREVIEW_FAILED:", err);
  process.exit(1);
});
