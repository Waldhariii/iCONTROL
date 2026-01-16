#!/usr/bin/env node
/* ICONTROL_LOCAL_WEB_SSOT_SERVER_JS_V1 */

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

function arg(name, def) {
  const idx = process.argv.indexOf(name);
  if (idx >= 0 && process.argv[idx + 1]) return process.argv[idx + 1];
  return def;
}

const HOST = arg("--host", process.env.HOST || "127.0.0.1");
const PORT = Number(arg("--port", process.env.PORT || "4176"));
const DIST = arg("--dist", process.env.DIST || "./dist");

const appDist = path.resolve(DIST, "app");
const cpDist = path.resolve(DIST, "cp");

function send(res, status, headers, body) {
  res.statusCode = status;
  if (headers) {
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  }
  res.end(body);
}

function sendJson(res, status, obj) {
  send(
    res,
    status,
    { "Content-Type": "application/json", "Cache-Control": "no-store" },
    JSON.stringify(obj),
  );
}

function safeJoin(baseDir, reqPath) {
  const clean = reqPath.replace(/^\/+/, "");
  const p = path.normalize(clean).replace(/^(\.\.(\/|\\|$))+/, "");
  return path.join(baseDir, p);
}

function serveStatic(res, baseDir, urlPath, mountBase) {
  const rel = urlPath.slice(mountBase.length).replace(/^\/+/, "");
  const candidate = rel || "index.html";
  const filePath = safeJoin(baseDir, candidate);
  const fallbackIndex = path.join(baseDir, "index.html");

  const chosen =
    fs.existsSync(filePath) && fs.statSync(filePath).isFile()
      ? filePath
      : fallbackIndex;

  if (!fs.existsSync(chosen)) {
    send(res, 404, { "Content-Type": "text/plain" }, "Not found");
    return;
  }

  const ext = path.extname(chosen).toLowerCase();
  const ct =
    ext === ".html"
      ? "text/html; charset=utf-8"
      : ext === ".js"
        ? "application/javascript; charset=utf-8"
        : ext === ".css"
          ? "text/css; charset=utf-8"
          : ext === ".json"
            ? "application/json; charset=utf-8"
            : ext === ".svg"
              ? "image/svg+xml"
              : ext === ".png"
                ? "image/png"
                : ext === ".ico"
                  ? "image/x-icon"
                  : "application/octet-stream";

  send(res, 200, { "Content-Type": ct, "Cache-Control": "no-store" }, fs.readFileSync(chosen));
}

function runtimeConfigPayload() {
  return {
    tenant_id: "local",
    app_base_path: "/app",
    cp_base_path: "/cp",
    api_base_url: `http://${HOST}:${PORT}/api`,
    assets_base_url: `http://${HOST}:${PORT}/assets`,
    version: 1,
  };
}

function handleRuntimeConfigRequest(req, res) {
  try {
    const method = (req.method || "GET").toUpperCase();
    const origin = `http://${req.headers.host || HOST}`;
    const u = new URL(req.url || "/", origin);
    const pathname = u.pathname;

    if (pathname === "/app/api/runtime-config" || pathname === "/cp/api/runtime-config") {
      if (method !== "GET") {
        res.setHeader("Allow", "GET");
        return sendJson(res, 405, { code: "ERR_METHOD_NOT_ALLOWED" });
      }
      res.setHeader("X-ICONTROL-SSOT", "1");
      return sendJson(res, 200, runtimeConfigPayload());
    }

    if (pathname === "/") {
      res.statusCode = 302;
      res.setHeader("Location", "/app/");
      res.end();
      return;
    }

    if (pathname.startsWith("/app")) return serveStatic(res, appDist, pathname, "/app");
    if (pathname.startsWith("/cp")) return serveStatic(res, cpDist, pathname, "/cp");

    send(res, 404, { "Content-Type": "text/plain" }, "Not found");
  } catch (err) {
    sendJson(res, 500, { code: "ERR_LOCAL_WEB_SERVER", error: String(err) });
  }
}

const server = http.createServer((req, res) => {
  handleRuntimeConfigRequest(req, res);
});

if (require.main === module) {
  server.listen(PORT, HOST, () => {
    // eslint-disable-next-line no-console
    console.log(
      `ICONTROL_LOCAL_WEB_READY http://${HOST}:${PORT}/app/#/login | http://${HOST}:${PORT}/cp/#/login`,
    );
  });
}

module.exports = { handleRuntimeConfigRequest };
