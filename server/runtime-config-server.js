/* eslint-disable no-console */
const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");

const HOST = process.env.ICONTROL_LOCAL_HOST || "127.0.0.1";
const PORT = Number(process.env.ICONTROL_LOCAL_PORT || "4176");

const ROOT = path.resolve(__dirname, "..");
const distRoot = path.resolve(ROOT, "dist");
const appDist = path.resolve(distRoot, "app");
const cpDist = path.resolve(distRoot, "cp");

function send(res, code, headers, body) {
  res.statusCode = code;
  for (const [k, v] of Object.entries(headers || {})) res.setHeader(k, v);
  res.end(body || "");
}

function sendJson(res, code, obj) {
  send(
    res,
    code,
    {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
    JSON.stringify(obj),
  );
}

function normalizePathname(p) {
  if (!p) return "/";
  p = p.replace(/\/+/g, "/");
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

function serveRuntimeConfig(req, res, requestedBase) {
  if ((req.method || "GET") !== "GET") {
    res.statusCode = 405;
    res.setHeader("cache-control", "no-store");
    res.end("Method Not Allowed");
    return;
  }
  sendJson(res, 200, {
    app_base_path: "/app",
    cp_base_path: "/cp",
    requested_base: requestedBase,
    env: "local",
  });
}

function serveStatic(req, res, distDir, basePrefix) {
  const url = new URL(
    req.url || "/",
    `http://${req.headers.host || "127.0.0.1"}`,
  );
  const raw = normalizePathname(url.pathname);

  if (raw === basePrefix) {
    res.statusCode = 302;
    res.setHeader("location", `${basePrefix}/`);
    res.end();
    return;
  }

  let rel = raw.startsWith(basePrefix + "/")
    ? raw.slice(basePrefix.length + 1)
    : "";
  if (!rel) rel = "index.html";

  rel = rel.replace(/^\/+/, "");
  const filePath = path.resolve(distDir, rel);
  if (!filePath.startsWith(distDir)) return send(res, 400, {}, "Bad request");

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    // SPA fallback
    const idx = path.resolve(distDir, "index.html");
    if (fs.existsSync(idx)) {
      res.setHeader("content-type", "text/html; charset=utf-8");
      res.setHeader("cache-control", "no-store");
      res.end(fs.readFileSync(idx));
      return;
    }
    return send(res, 404, {}, "Not found");
  }

  const ext = path.extname(filePath).toLowerCase();
  const ctype =
    ext === ".html"
      ? "text/html; charset=utf-8"
      : ext === ".js"
        ? "application/javascript; charset=utf-8"
        : ext === ".css"
          ? "text/css; charset=utf-8"
          : ext === ".json"
            ? "application/json; charset=utf-8"
            : "application/octet-stream";

  res.setHeader("content-type", ctype);
  res.setHeader("cache-control", "no-store");
  res.end(fs.readFileSync(filePath));
}

function handleRuntimeConfigRequest(req, res) {
  try {
    const u = new URL(
      req.url || "/",
      `http://${req.headers.host || "127.0.0.1"}`,
    );
    const pathname = normalizePathname(u.pathname);

    // 1) SSOT endpoints first
    if (pathname === "/app/api/runtime-config")
      return serveRuntimeConfig(req, res, "/app");
    if (pathname === "/cp/api/runtime-config")
      return serveRuntimeConfig(req, res, "/cp");

    // 2) root redirect
    if (pathname === "/") {
      res.statusCode = 302;
      res.setHeader("location", "/app/");
      res.end();
      return;
    }

    // 3) static surfaces
    if (pathname === "/app" || pathname.startsWith("/app/"))
      return serveStatic(req, res, appDist, "/app");
    if (pathname === "/cp" || pathname.startsWith("/cp/"))
      return serveStatic(req, res, cpDist, "/cp");

    return send(res, 404, {}, "Not found");
  } catch (err) {
    return sendJson(res, 500, {
      code: "ERR_RUNTIME_CONFIG_SERVER",
      error: String(err),
    });
  }
}

function createServer() {
  return http.createServer((req, res) => handleRuntimeConfigRequest(req, res));
}

if (require.main === module) {
  const server = createServer();
  server.listen(PORT, HOST, () => {
    console.log(
      `ICONTROL_LOCAL_WEB_READY http://${HOST}:${PORT}/app/#/home-app | http://${HOST}:${PORT}/cp/#/home-cp`,
    );
  });
}

module.exports = { handleRuntimeConfigRequest, createServer };
