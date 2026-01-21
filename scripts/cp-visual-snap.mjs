import { spawn } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { createRequire } from "node:module";

const icontrolRoot = process.cwd();
const require = createRequire(path.join(icontrolRoot, "package.json"));
const { chromium } = require("playwright");

const workspaceRoot = path.resolve(icontrolRoot, "..");
const routesCpPath = path.join(workspaceRoot, "_ARCHIVES", "ui-preview", "routes_cp.txt");

const HOST = "127.0.0.1";
const APP_PORT = process.env.ICONTROL_APP_PORT || "5176";
const CP_PORT = process.env.ICONTROL_CP_PORT || "5177";

function sanitize(value) {
  return value.replace(/^\/+/, "").replace(/[?#]/g, "_").replace(/[^a-zA-Z0-9._-]+/g, "_");
}

async function readRoutes(filePath) {
  const raw = await fsp.readFile(filePath, "utf8");
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function waitForServer(url, timeoutMs = 90000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.request(url, { method: "GET" }, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) resolve();
        else retry();
      });
      req.on("error", retry);
      req.end();
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Server did not respond: ${url}`));
        return;
      }
      setTimeout(tick, 750);
    };
    tick();
  });
}

function renderIndex(items, outputRoot) {
  const cards = items.map((item) => {
    const rel = path.relative(outputRoot, item.path).split(path.sep).join("/");
    return `<a class="thumb" href="${rel}"><img src="${rel}" alt="${item.route}"><span>${item.route}</span></a>`;
  });
  return `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>CP Visual Index</title>
    <style>
      body { margin: 24px; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", Segoe UI, Roboto, Arial, sans-serif; background: #f5f5f5; color: #1a1a1a; }
      h1 { margin: 0 0 16px; }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
      .thumb { display:block; text-decoration:none; color:inherit; border:1px solid #dcdcdc; border-radius:10px; overflow:hidden; background:#fff; box-shadow: 0 10px 24px rgba(0,0,0,0.08); }
      .thumb img { width:100%; display:block; }
      .thumb span { display:block; padding:8px 10px; font-size:12px; word-break:break-all; }
    </style>
  </head>
  <body>
    <h1>Control Plane — Visual Proof</h1>
    <div class="grid">
      ${cards.join("\n")}
    </div>
  </body>
</html>`;
}

async function main() {
  if (!fs.existsSync(routesCpPath)) {
    throw new Error("routes_cp.txt missing in _ARCHIVES/ui-preview");
  }

  const outputRoot = path.join(os.homedir(), "Desktop", "iCONTROL_UI_SCREENSHOTS");
  const outputCp = path.join(outputRoot, "cp");
  const outputApp = path.join(outputRoot, "app");
  await fsp.mkdir(outputCp, { recursive: true });
  await fsp.mkdir(outputApp, { recursive: true });

  const server = spawn("npm", ["run", "dev:both"], { cwd: icontrolRoot, stdio: "inherit" });
  const stop = () => {
    if (!server.killed) server.kill("SIGTERM");
  };

  try {
    await waitForServer(`http://${HOST}:${CP_PORT}/cp/`);
    const routes = await readRoutes(routesCpPath);

    const browser = await chromium.launch({ headless: true });
    const items = [];

    // Login capture (no session)
    const loginRoute = routes.find((r) => r.includes("#/login"));
    if (loginRoute) {
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
      await page.goto(`http://${HOST}:${CP_PORT}${loginRoute}`, { waitUntil: "networkidle" });
      const filePath = path.join(outputCp, `${sanitize(loginRoute)}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      items.push({ route: loginRoute, path: filePath });
      await page.close();
    }

    // Authenticated CP session for remaining routes
    const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
    await context.addInitScript(() => {
      try {
        localStorage.setItem("icontrol_mgmt_session_v1", JSON.stringify({
          username: "ui_capture",
          role: "SYSADMIN",
          issuedAt: Date.now()
        }));
      } catch {}
    });
    const page = await context.newPage();

    for (const route of routes) {
      if (route.includes("#/login")) continue;
      const url = `http://${HOST}:${CP_PORT}${route}`;
      await page.goto(url, { waitUntil: "networkidle" });
      const filePath = path.join(outputCp, `${sanitize(route)}.png`);
      await page.screenshot({ path: filePath, fullPage: true });
      items.push({ route, path: filePath });
    }

    await page.close();
    await context.close();
    await browser.close();

    const indexHtml = renderIndex(items, outputRoot);
    await fsp.writeFile(path.join(outputRoot, "INDEX_VISUEL.html"), indexHtml, "utf8");
  } finally {
    stop();
  }
}

main().catch((err) => {
  console.error("CP_VISUAL_SNAP_FAILED:", err);
  process.exit(1);
});
