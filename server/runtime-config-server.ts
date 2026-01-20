import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

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
const appDist = path.join(distRoot, "app");
const cpDist = path.join(distRoot, "cp");

const MIME: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".json": "application/json; charset=utf-8",
};

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

function getTenantIdFromCookie(header?: string): string {
  const cookies = parseCookies(header);
  return (
    cookies.icontrol_tenant_id || cookies.tenant_id || cookies.tenant || "local"
  );
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

function safeResolve(baseDir: string, urlPath: string): string | null {
  const clean = urlPath.split("?")[0] || "/";
  const rel = clean.replace(/^\//, "");
  const fsPath = path.normalize(path.join(baseDir, rel));
  if (!fsPath.startsWith(baseDir)) return null;
  return fsPath;
}

function serveStatic(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  baseDir: string,
  basePath: string,
) {
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
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.end(fs.readFileSync(fallback));
      return;
    }
    res.statusCode = 404;
    res.end("Not found");
    return;
  }

  const ext = path.extname(filePath);
  res.statusCode = 200;
  res.setHeader("Content-Type", MIME[ext] || "application/octet-stream");
  res.end(fs.readFileSync(filePath));
}

export function handleRuntimeConfigRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
) {
  try {
    const u = new URL(req.url || "/", getOrigin(req));
    const pathname = u.pathname;

    if (pathname === "/app/api/runtime-config") {
      serveRuntimeConfig(req, res);
      return;
    }
    if (pathname === "/cp/api/runtime-config" || pathname === "/api/runtime/config") {
      serveRuntimeConfig(req, res);
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
        // eslint-disable-next-line no-console
        console.log(
          `runtime-config server (dev) on http://${addr.address}:${addr.port}`,
        );
      }
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

if (import.meta.url === `file://${process.argv[1]}`) {
  const args = parseArgs(process.argv.slice(2));
  const port = Number(process.env.PORT || args.port || 4176);
  const host = String(process.env.HOST || args.host || "127.0.0.1");
  const server = createRuntimeConfigServer({ dev: !!args.dev });
  server.listen(port, host);
}
