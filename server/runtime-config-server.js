/* eslint-disable no-console */
const http = require("node:http");
const path = require("node:path");
const fs = require("node:fs");

const HOST = process.env.ICONTROL_LOCAL_HOST || "127.0.0.1";
const PORT = Number(process.env.ICONTROL_LOCAL_PORT || "4176");

const ROOT = path.resolve(__dirname, "..");
// Le build crée dist/ dans app/dist/ (à cause de npm --prefix app)
// Vérifier les deux emplacements possibles
const distRootApp = path.resolve(ROOT, "app", "dist");
const distRootRoot = path.resolve(ROOT, "dist");
const appDist = fs.existsSync(path.resolve(distRootApp, "app")) 
  ? path.resolve(distRootApp, "app")
  : path.resolve(distRootRoot, "app");
const cpDist = fs.existsSync(path.resolve(distRootApp, "cp"))
  ? path.resolve(distRootApp, "cp")
  : path.resolve(distRootRoot, "cp");

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
  
  // ICONTROL_PRODUCTION_CONFIG_V1: Support variables d'environnement
  const config = (() => {
    try {
      // Essayer de charger config.production.js si en production
      if (process.env.NODE_ENV === "production") {
        try {
          const prodConfig = require("./config.production.js");
          return prodConfig.getRuntimeConfig(req);
        } catch {
          // Fallback si fichier non trouvé
        }
      }
    } catch {}
    
    // Configuration par défaut (local/dev)
    const host = (req.headers.host || "127.0.0.1").toString();
    const proto = (req.headers["x-forwarded-proto"] || "http").toString();
    const origin = `${proto}://${host}`;
    
    const appBase = process.env.ICONTROL_APP_BASE_URL || "/app";
    const cpBase = process.env.ICONTROL_CP_BASE_URL || "/cp";
    const apiBase = process.env.ICONTROL_API_BASE_URL || "/api";
    const assetsBase = process.env.ICONTROL_ASSETS_BASE_URL || "/assets";
    
    return {
      tenant_id: process.env.ICONTROL_TENANT_ID || "local-dev",
      app_base_path: appBase,
      cp_base_path: cpBase,
      api_base_url: new URL(apiBase, origin).toString(),
      assets_base_url: new URL(assetsBase, origin).toString(),
      requested_base: requestedBase,
      env: process.env.NODE_ENV || "local",
      version: 1,
    };
  })();
  
  sendJson(res, 200, config);
}

// ICONTROL_MIME_TYPES_V1: Types MIME pour les fichiers statiques
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".eot": "application/vnd.ms-fontobject",
  ".otf": "font/otf",
  ".ico": "image/x-icon",
  ".xml": "text/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || "application/octet-stream";
}

function serveStatic(req, res, distDir, basePrefix, rawPath) {
  const method = req && req.method ? req.method : "GET";
  const p = typeof rawPath === "string" ? rawPath : "/";

  let rel = "index.html";
  if (p === basePrefix || p === `${basePrefix}/`) {
    rel = "index.html";
  } else if (p.startsWith(`${basePrefix}/`)) {
    rel = p.slice(basePrefix.length + 1);
    if (!rel || rel.endsWith("/")) rel = "index.html";
  }

  try {
    rel = decodeURIComponent(rel);
  } catch {
    // ignore
  }
  rel = rel.replace(/^\/+/, "");
  rel = rel.replace(/\\/g, "/");
  if (rel.includes("..")) rel = "index.html";

  const indexPath = path.join(distDir, "index.html");
  const filePath = path.join(distDir, rel);

  // ICONTROL_ASSET_ROUTING_V1: Servir les assets AVANT le fallback SPA
  // Empêcher de servir HTML pour les fichiers JS/CSS/etc.
  const isAsset = rel.startsWith("assets/") || 
                  rel.endsWith(".js") || 
                  rel.endsWith(".mjs") || 
                  rel.endsWith(".css") || 
                  rel.endsWith(".json") || 
                  rel.endsWith(".map") ||
                  rel.endsWith(".png") ||
                  rel.endsWith(".jpg") ||
                  rel.endsWith(".svg") ||
                  rel.endsWith(".woff") ||
                  rel.endsWith(".woff2");

  const serveFile = (fp, contentType) => {
    const ct = contentType || getContentType(fp);
    // ICONTROL_MIME_ENFORCEMENT_V1: Forcer le bon Content-Type
    if (fp.endsWith(".js") || fp.endsWith(".mjs")) {
      res.setHeader("content-type", "text/javascript; charset=utf-8");
    } else if (fp.endsWith(".css")) {
      res.setHeader("content-type", "text/css; charset=utf-8");
    } else {
      res.setHeader("content-type", ct);
    }
    res.setHeader("cache-control", "no-store");
    res.statusCode = 200;
    if (method === "HEAD") {
      res.end();
      return;
    }
    fs.createReadStream(fp).pipe(res);
  };

  // Si c'est un asset et qu'il existe, le servir directement
  if (isAsset && fs.existsSync(filePath)) {
    const st = fs.statSync(filePath);
    if (st.isFile()) {
      return serveFile(filePath);
    }
  }

  // Pour les assets qui n'existent pas, retourner 404 (pas de fallback HTML)
  if (isAsset) {
    res.statusCode = 404;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.setHeader("cache-control", "no-store");
    res.end("Asset Not Found");
    return;
  }

  // Pour les routes applicatives, servir index.html (fallback SPA)
  if ((method === "GET" || method === "HEAD") && fs.existsSync(indexPath)) {
    return serveFile(indexPath, "text/html; charset=utf-8");
  }

  res.statusCode = 404;
  res.setHeader("cache-control", "no-store");
  res.end("Not Found");
}

function serveMetaRelease(req, res) {
  if ((req.method || "GET") !== "GET") {
    res.statusCode = 405;
    res.setHeader("cache-control", "no-store");
    res.end("Method Not Allowed");
    return;
  }

  // ICONTROL_VERSION_GATE_V1: Endpoint /meta/release pour version gating
  const clientVersion = req.headers["x-client-version"] || "0.0.0";
  
  // En production, cela devrait charger depuis une base de données ou un fichier de config
  // Pour l'instant, on utilise des valeurs par défaut
  const latestVersion = process.env.ICONTROL_LATEST_VERSION || "0.2.0";
  const minSupportedVersion = process.env.ICONTROL_MIN_SUPPORTED_VERSION || "0.2.0";
  
  // Comparaison simple de versions (format X.Y.Z)
  function compareVersions(v1, v2) {
    const parts1 = v1.split(".").map(Number);
    const parts2 = v2.split(".").map(Number);
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;
      if (p1 < p2) return -1;
      if (p1 > p2) return 1;
    }
    return 0;
  }
  
  const requiresUpdate = compareVersions(clientVersion, minSupportedVersion) < 0;
  
  if (requiresUpdate) {
    // HTTP 426 Upgrade Required
    res.statusCode = 426;
    res.setHeader("cache-control", "no-store");
    sendJson(res, 426, {
      latest: latestVersion,
      minSupported: minSupportedVersion,
      message: `Une nouvelle version est disponible (${latestVersion}). Veuillez mettre à jour pour continuer.`,
      url: `${req.headers["x-forwarded-proto"] || "http"}://${req.headers.host || "127.0.0.1"}/app/`,
      requiresUpdate: true
    });
    return;
  }
  
  // Version OK
  sendJson(res, 200, {
    latest: latestVersion,
    minSupported: minSupportedVersion,
    message: "",
    url: "",
    requiresUpdate: false
  });
}

function handleRuntimeConfigRequest(req, res) {
  try {
    const u = new URL(
      req.url || "/",
      `http://${req.headers.host || "127.0.0.1"}`,
    );
    const rawPath = u.pathname || "/";
    const pathname = normalizePathname(rawPath);

    // 1) Meta endpoints (version gating)
    if (pathname === "/meta/release") {
      return serveMetaRelease(req, res);
    }

    // 2) API (normalized only)
    if (pathname === "/app/api/runtime-config")
      return serveRuntimeConfig(req, res, "/app");
    if (pathname === "/cp/api/runtime-config" || pathname === "/api/runtime/config")
      return serveRuntimeConfig(req, res, "/cp");

    // 2) root redirect
    if (pathname === "/") {
      res.statusCode = 302;
      res.setHeader("location", "/app/");
      res.end();
      return;
    }

    // 3) missing-slash redirects (rawPath only)
    if (rawPath === "/app") {
      res.writeHead(302, { Location: "/app/" });
      res.end();
      return;
    }
    if (rawPath === "/cp") {
      res.writeHead(302, { Location: "/cp/" });
      res.end();
      return;
    }

    // 4) static surfaces (rawPath only)
    if (rawPath === "/app/" || rawPath.startsWith("/app/"))
      return serveStatic(req, res, appDist, "/app", rawPath);
    if (rawPath === "/cp/" || rawPath.startsWith("/cp/"))
      return serveStatic(req, res, cpDist, "/cp", rawPath);
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
      `ICONTROL_LOCAL_WEB_READY http://${HOST}:${PORT}/app/#/login | http://${HOST}:${PORT}/cp/#/login`,
    );
  });
}

module.exports = { handleRuntimeConfigRequest, createServer };
