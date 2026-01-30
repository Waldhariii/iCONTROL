import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { info } from "./log";
type RuntimeConfig = {
  tenant_id: string;
  app_base_path: string;
  cp_base_path: string;
  api_base_url: string;
  assets_base_url: string;
  version: number;
};

type ServerOptions = {
  host?: string;
  port?: number;
  dev?: boolean;
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(serverRoot, "..");
const distRoot = path.join(repoRoot, "dist");
const assetsDist = path.join(distRoot, "assets");
const appDistFixed = path.join(repoRoot, "app", "dist", "app");
const cpDistFixed = path.join(repoRoot, "app", "dist", "cp");
const appDist = fs.existsSync(path.join(appDistFixed, "index.html"))
  ? appDistFixed
  : path.join(distRoot, "app");
const cpDist = fs.existsSync(path.join(cpDistFixed, "index.html"))
  ? cpDistFixed
  : path.join(distRoot, "cp");
// SSOT: route catalog path (same as JS legacy for compatibility)
const routeCatalogPath = path.resolve(repoRoot, "config", "ssot", "ROUTE_CATALOG.json");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
};

const TENANT_ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,62}$/;

function parseCookies(header: string | undefined): Record<string, string> {
  if (!header) return {};
  return header.split(";").reduce<Record<string, string>>((acc, part) => {
    const idx = part.indexOf("=");
    if (idx === -1) return acc;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) acc[k] = v;
    return acc;
  }, {});
}

function sanitizeTenantId(raw: string | undefined): string | null {
  const t = String(raw || "").trim();
  if (!t) return null;
  if (!TENANT_ID_RE.test(t)) return null;
  return t;
}

function getTenantIdFromCookie(header?: string): string {
  const cookies = parseCookies(header);
  const candidate = cookies.icontrol_tenant_id || cookies.tenant_id || cookies.tenant;
  return sanitizeTenantId(candidate) || "local";
}

function getOrigin(req: http.IncomingMessage): string {
  const host = (req.headers.host || "127.0.0.1").toString();
  const proto = (req.headers["x-forwarded-proto"] || "http").toString();
  return `${proto}://${host}`;
}

function buildRuntimeConfig(req: http.IncomingMessage): RuntimeConfig {
  const origin = getOrigin(req);
  return {
    tenant_id: getTenantIdFromCookie(req.headers.cookie),
    app_base_path: "/app",
    cp_base_path: "/cp",
    api_base_url: new URL("/api", origin).toString(),
    assets_base_url: new URL("/assets", origin).toString(),
    version: 1,
  };
}

function sendJson(res: http.ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(payload));
}

function serveRuntimeConfig(
  req: http.IncomingMessage,
  res: http.ServerResponse,
) {
  if ((req.method || "GET").toUpperCase() !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    res.setHeader("Cache-Control", "no-store");
    res.end();
    return;
  }
  res.setHeader("X-ICONTROL-SSOT", "1");
  sendJson(res, 200, buildRuntimeConfig(req));
}

// SSOT: serve route catalog (parity with JS legacy)
function detectRouteCatalogSurface(req: http.IncomingMessage): "CP" | "CLIENT" {
  try {
    const u = new URL(req.url || "/", getOrigin(req));
    const pathname = normalizePathname(u.pathname);
    if (pathname.startsWith("/cp/") || pathname === "/cp") return "CP";
    if (pathname.startsWith("/app/") || pathname === "/app") return "CLIENT";
  } catch {}
  return "CP";
}

function serveRouteCatalog(
  req: http.IncomingMessage,
  res: http.ServerResponse,
) {
  if ((req.method || "GET").toUpperCase() !== "GET") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET");
    res.setHeader("Cache-Control", "no-store");
    res.end();
    return;
  }
  res.setHeader("X-ICONTROL-SSOT", "1");
  if (fs.existsSync(routeCatalogPath)) {
    try {
      const catalog = JSON.parse(fs.readFileSync(routeCatalogPath, "utf8"));
      const surface = detectRouteCatalogSurface(req);
      if (catalog && Array.isArray(catalog.routes)) {
        const routesFiltered = catalog.routes.filter(
          (r: { app_surface?: string }) => r?.app_surface === surface,
        );
        sendJson(res, 200, { ...catalog, routes: routesFiltered });
      } else {
        sendJson(res, 200, catalog);
      }
      return;
    } catch (err) {
      sendJson(res, 500, {
        code: "ERR_ROUTE_CATALOG_READ",
        message: String(err),
      });
      return;
    }
  }
  sendJson(res, 404, {
    code: "ERR_ROUTE_CATALOG_NOT_FOUND",
    message: "ROUTE_CATALOG.json not found",
  });
}

function safeResolve(baseDir: string, urlPath: string): string | null {
  const clean = urlPath.split("?")[0] || "/";
  const rel = clean.replace(/^\//, "");
  const fsPath = path.normalize(path.join(baseDir, rel));
  if (!fsPath.startsWith(baseDir)) return null;
  return fsPath;
}

function normalizePathname(p: string): string {
  if (!p) return "/";
  p = p.replace(/\/+/g, "/");
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  return p;
}

function serveStatic(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  baseDir: string,
  basePath: string,
) {
  const isHead = (req.method || "GET").toUpperCase() === "HEAD";
  const setDistHeader = () => {
    if (basePath === "/app") res.setHeader("X-ICONTROL-APPDIST", baseDir);
    if (basePath === "/cp") res.setHeader("X-ICONTROL-CPDIST", baseDir);
  };
  const u = new URL(req.url || "/", getOrigin(req));
  const raw = normalizePathname(u.pathname);

  // Handle basePrefix (e.g., /app) -> serve index.html directly
  // Avoid redirect loop: /app/ normalizes to /app, which would redirect to /app/ again
  if (raw === basePath) {
    const idx = safeResolve(baseDir, "/index.html");
    if (idx && fs.existsSync(idx)) {
      const stat = fs.statSync(idx);
      const etag = `W/"${stat.size}-${stat.mtimeMs}"`;
      const inm = String(req.headers["if-none-match"] || "");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("ETag", etag);
      setDistHeader();
      if (inm === etag) {
        res.statusCode = 304;
        res.end();
        return;
      }
      res.statusCode = 200;
      res.setHeader("Content-Length", stat.size);
      if (isHead) {
        res.end();
        return;
      }
      const stream = fs.createReadStream(idx);
      stream.on("error", () => {
        res.statusCode = 500;
        res.end("Read error");
      });
      stream.pipe(res);
      return;
    }
    res.statusCode = 404;
    res.end("Not found");
    return;
  }

  const rawPath = (req.url || "/").split("?")[0] || "/";
  const relPath = rawPath.replace(basePath, "") || "/";
  const wantsDir = relPath === "/" || relPath.endsWith("/");
  const candidate = wantsDir ? "/index.html" : relPath;

  const filePath = safeResolve(baseDir, candidate);
  if (!filePath) {
    res.statusCode = 400;
    res.end("Bad path");
    return;
  }

  if (!fs.existsSync(filePath)) {
    const fallback = safeResolve(baseDir, "/index.html");
    if (fallback && fs.existsSync(fallback)) {
      const stat = fs.statSync(fallback);
      const etag = `W/"${stat.size}-${stat.mtimeMs}"`;
      const inm = String(req.headers["if-none-match"] || "");
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("ETag", etag);
      if (inm === etag) {
        res.statusCode = 304;
        res.end();
        return;
      }
      res.statusCode = 200;
      res.setHeader("Content-Length", stat.size);
      const stream = fs.createReadStream(fallback);
      stream.on("error", () => {
        res.statusCode = 500;
        res.end("Read error");
      });
      stream.pipe(res);
      return;
    }
    res.statusCode = 404;
    res.end("Not found");
    return;
  }

  const stat = fs.statSync(filePath);
  const etag = `W/"${stat.size}-${stat.mtimeMs}"`;
  const inm = String(req.headers["if-none-match"] || "");
  const isHtml = path.extname(filePath) === ".html";
  res.setHeader("ETag", etag);
  res.setHeader("Cache-Control", isHtml ? "no-store" : "public, max-age=3600");
  if (inm === etag) {
    res.statusCode = 304;
    res.end();
    return;
  }

  const ext = path.extname(filePath);
  res.statusCode = 200;
  res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
  res.setHeader("Content-Length", stat.size);
  setDistHeader();
  // CORS headers for ES modules (needed when crossorigin attribute is used)
  if (ext === ".js" || ext === ".mjs") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }
  if (isHead) {
    res.end();
    return;
  }
  const stream = fs.createReadStream(filePath);
  stream.on("error", () => {
    res.statusCode = 500;
    res.end("Read error");
  });
  stream.pipe(res);
}

export function handleRuntimeConfigRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
) {
  try {
    // Handle OPTIONS requests for CORS
    if ((req.method || "GET").toUpperCase() === "OPTIONS") {
      res.statusCode = 200;
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Content-Length", "0");
      res.end();
      return;
    }
    
    const u = new URL(req.url || "/", getOrigin(req));
    const pathname = u.pathname;

    // SSOT: Routing order is STRICT and IMMUTABLE
    // 1) Health endpoints (no async dependencies, always available)
    if (pathname === "/api/health") {
      res.statusCode = 200;
      res.setHeader("X-ICONTROL-SSOT", "1");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.end(
        JSON.stringify({
          status: "ok",
          service: "runtime-config-server",
          ssot: 1,
          version: 1,
        }),
      );
      return;
    }
    if (pathname === "/healthz") {
      res.statusCode = 200;
      res.setHeader("X-ICONTROL-SSOT", "1");
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.end(
        JSON.stringify({
          status: "ok",
          service: "runtime-config-server",
          ssot: 1,
          version: 1,
        }),
      );
      return;
    }

    // 2) Runtime config endpoints
    if (pathname === "/app/api/runtime-config") {
      serveRuntimeConfig(req, res);
      return;
    }
    if (pathname === "/cp/api/runtime-config") {
      serveRuntimeConfig(req, res);
      return;
    }

    // 3) Route catalog endpoints
    if (pathname === "/app/api/route-catalog") {
      serveRouteCatalog(req, res);
      return;
    }
    if (pathname === "/cp/api/route-catalog") {
      serveRouteCatalog(req, res);
      return;
    }

    // Static routing (after API endpoints)
    if (pathname.startsWith("/assets")) {
      serveStatic(req, res, assetsDist, "/assets");
      return;
    }
    if (pathname.startsWith("/app/assets")) {
      serveStatic(req, res, assetsDist, "/app/assets");
      return;
    }
    if (pathname.startsWith("/cp/assets")) {
      serveStatic(req, res, assetsDist, "/cp/assets");
      return;
    }
    if (pathname.startsWith("/app")) {
      serveStatic(req, res, appDist, "/app");
      return;
    }
    if (pathname.startsWith("/cp")) {
      serveStatic(req, res, cpDist, "/cp");
      return;
    }

    if (pathname === "/") {
      res.statusCode = 302;
      res.setHeader("Location", "/app/");
      res.end();
      return;
    }

    res.statusCode = 404;
    res.end("Not found");
  } catch (err) {
    sendJson(res, 500, {
      code: "ERR_RUNTIME_CONFIG_SERVER",
      error: String(err),
    });
  }
}

export function createRuntimeConfigServer(opts: ServerOptions = {}) {
  const server = http.createServer((req, res) => {
    handleRuntimeConfigRequest(req, res);
  });

  if (opts.dev) {
    server.on("listening", () => {
      const addr = server.address();
      if (addr && typeof addr !== "string") {
        info("INFO_RUNTIME_CONFIG_LISTENING", "runtime-config-server", "listening (dev)", { host: addr.address, port: addr.port, url: `http://${addr.address}:${addr.port}` });}
    });
  }

  return server;
}

function parseArgs(argv: string[]) {
  const out: { port?: number; host?: string; dev?: boolean } = {};
  for (let i = 0; i < argv.length; i += 1) {
    const v = argv[i];
    if (v === "--dev") out.dev = true;
    if (v === "--port") out.port = Number(argv[i + 1]);
    if (v === "--host") out.host = argv[i + 1];
  }
  return out;
}

// Start server if run directly (not imported)
// Use fileURLToPath to normalize paths for comparison
const currentFile = fileURLToPath(import.meta.url);
const mainFile = process.argv[1] ? path.resolve(process.argv[1]) : "";

if (currentFile === mainFile || mainFile.includes("runtime-config-server.mjs")) {
  const args = parseArgs(process.argv.slice(2));
  const port = Number(process.env.PORT || args.port || 4176);
  const host = String(process.env.HOST || args.host || "127.0.0.1");
  const server = createRuntimeConfigServer({ dev: !!args.dev });
  server.listen(port, host, () => {
    info("INFO_RUNTIME_CONFIG_LISTENING", "runtime-config-server", "listening", { host, port, url: `http://${host}:${port}` });
  });
}
