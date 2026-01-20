import { spawn } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const icontrolRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(icontrolRoot, "..");

const OUTPUT_ROOT = path.join(workspaceRoot, "_ARCHIVES", "ui-catalog");
const HOST = "127.0.0.1";
const PORT_APP = "5176";
const PORT_CP = "5177";

function timestampDir() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}${mm}${dd}_${hh}${min}`;
}

function waitForServer(baseUrl, timeoutMs = 90000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tick = () => {
      const req = http.request(baseUrl, { method: "GET" }, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 500) resolve();
        else retry();
      });
      req.on("error", retry);
      req.end();
    };
    const retry = () => {
      if (Date.now() - start > timeoutMs) {
        reject(new Error(`Server did not respond: ${baseUrl}`));
        return;
      }
      setTimeout(tick, 750);
    };
    tick();
  });
}

function sanitize(value) {
  return value.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

function renderIndex(entries, outputDir) {
  const sections = [];
  const grouped = {};
  for (const entry of entries) {
    const key = `${entry.surface}-${entry.theme}`;
    grouped[key] ||= [];
    grouped[key].push(entry);
  }
  Object.keys(grouped).forEach((key) => {
    sections.push(`<h2>${key}</h2>`);
    sections.push('<div class="grid">');
    grouped[key].forEach((entry) => {
      const rel = path
        .relative(outputDir, entry.filePath)
        .split(path.sep)
        .join("/");
      sections.push(
        `<a class="thumb" href="${rel}"><img src="${rel}" alt="${entry.label}"><span>${entry.label}</span></a>`
      );
    });
    sections.push("</div>");
  });
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>UI Catalog Snapshots</title>
    <style>
      body { margin: 24px; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", Segoe UI, Roboto, Arial, sans-serif; }
      h2 { margin: 22px 0 10px; }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 16px; }
      .thumb { display:block; text-decoration:none; color:inherit; border:1px solid #ddd; border-radius:10px; overflow:hidden; background:#fff; }
      .thumb img { width:100%; display:block; }
      .thumb span { display:block; padding:8px 10px; font-size:12px; word-break:break-all; }
    </style>
  </head>
  <body>
    <h1>UI Catalog Snapshots</h1>
    ${sections.join("\n")}
  </body>
</html>`;
}

async function main() {
  const timestamp = timestampDir();
  const outputDir = path.join(OUTPUT_ROOT, timestamp);
  const shotsDir = path.join(outputDir, "screenshots");
  await fsp.mkdir(shotsDir, { recursive: true });

  const devServer = spawn("npm", ["run", "dev:both"], {
    cwd: icontrolRoot,
    stdio: "inherit",
  });

  const stopServer = () => {
    if (!devServer.killed) devServer.kill("SIGTERM");
  };

  process.on("SIGINT", () => {
    stopServer();
    process.exit(1);
  });

  try {
    await waitForServer(`http://${HOST}:${PORT_APP}/app/`);
    await waitForServer(`http://${HOST}:${PORT_CP}/cp/`);

    const browser = await chromium.launch({ headless: true });
    const entries = [];
    for (const surface of ["app", "cp"]) {
      const port = surface === "app" ? PORT_APP : PORT_CP;
      const sessionKey = surface === "app" ? "icontrol_session_v1" : "icontrol_mgmt_session_v1";
      const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
      await context.addInitScript(
        ({ sessionKey }) => {
          try {
            localStorage.setItem(
              sessionKey,
              JSON.stringify({
                username: "ui_catalog",
                role: "SYSADMIN",
                issuedAt: Date.now(),
              })
            );
          } catch {}
        },
        { sessionKey }
      );
      const page = await context.newPage();
      const url = `http://${HOST}:${port}/${surface}/#/__ui-catalog`;
      await page.goto(url, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);

      for (const theme of ["dark", "light"]) {
        await page.selectOption("#ui-catalog-theme", theme);
        await page.waitForTimeout(600);
        const fullName = `${surface}_${theme}_full.png`;
        const fullPath = path.join(shotsDir, fullName);
        await page.screenshot({ path: fullPath, fullPage: true });
        entries.push({ surface, theme, label: "full", filePath: fullPath });

        const sections = await page.$$("[data-catalog-section]");
        let idx = 0;
        for (const section of sections) {
          const name = await section.getAttribute("data-catalog-section");
          const fileName = `${surface}_${theme}_${String(idx).padStart(2, "0")}_${sanitize(name || "section")}.png`;
          const filePath = path.join(shotsDir, fileName);
          await section.scrollIntoViewIfNeeded();
          await section.screenshot({ path: filePath });
          entries.push({ surface, theme, label: name || `section_${idx}`, filePath });
          idx += 1;
        }
      }
      await page.close();
      await context.close();
    }
    await browser.close();

    const indexHtml = renderIndex(entries, outputDir);
    const indexPath = path.join(outputDir, "INDEX.html");
    await fsp.writeFile(indexPath, indexHtml, "utf8");
    process.stdout.write(`UI catalog snapshots written: ${indexPath}\n`);
  } finally {
    stopServer();
  }
}

main().catch((err) => {
  console.error("UI catalog snapshots failed:", err);
  process.exit(1);
});
