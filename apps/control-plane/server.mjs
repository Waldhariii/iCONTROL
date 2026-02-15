import http from "http";
import { readFileSync, existsSync } from "fs";
import { extname, join } from "path";
import { createHmac, createHash, randomUUID } from "crypto";

const PORT = process.env.PORT || 6060;
const ROOT = process.cwd();
const PUBLIC = join(ROOT, "apps/control-plane/public");
const BACKEND = process.env.BACKEND_API_BASE || "http://localhost:7070";
const S2S_PRINCIPAL = "svc:cp";
const S2S_SCOPES = ["studio.*", "marketplace.*", "release.*", "runtime.read", "security.read"];
let cachedToken = null;
let cachedExp = 0;

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json"
};

function sha256Hex(input) {
  return createHash("sha256").update(input).digest("hex");
}

async function getS2SToken() {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedExp - now > 30) return cachedToken;
  const secret = process.env.S2S_CP_HMAC || "";
  if (!secret) throw new Error("Missing S2S_CP_HMAC");
  const body = JSON.stringify({ principal_id: S2S_PRINCIPAL, requested_scopes: S2S_SCOPES, audience: "backend-api" });
  const ts = Date.now().toString();
  const bodySha = sha256Hex(body);
  const canonical = `${ts}.POST./api/auth/token.${bodySha}`;
  const sig = createHmac("sha256", secret).update(canonical).digest("base64");
  const reqId = randomUUID();
  const res = await fetch(`${BACKEND}/api/auth/token`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-s2s-principal": S2S_PRINCIPAL,
      "x-s2s-timestamp": ts,
      "x-s2s-signature": sig,
      "x-request-id": reqId
    },
    body
  });
  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  const data = await res.json();
  cachedToken = data.access_token;
  cachedExp = data.expires_at || now + 60;
  return cachedToken;
}

const server = http.createServer((req, res) => {
  let path = req.url === "/" ? "/index.html" : req.url;
  if (path.startsWith("/api/")) {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", async () => {
      try {
        const token = await getS2SToken();
        const upstream = await fetch(`${BACKEND}${path}`, {
          method: req.method,
          headers: {
            "content-type": req.headers["content-type"] || "application/json",
            "x-tenant-id": req.headers["x-tenant-id"] || "",
            "x-scope": req.headers["x-scope"] || "",
            "x-request-id": req.headers["x-request-id"] || randomUUID(),
            authorization: `Bearer ${token}`
          },
          body: body || undefined
        });
        const text = await upstream.text();
        const headers = { "Content-Type": upstream.headers.get("content-type") || "application/json" };
        const reqId = upstream.headers.get("x-request-id");
        if (reqId) headers["x-request-id"] = reqId;
        res.writeHead(upstream.status, headers);
        return res.end(text);
      } catch (err) {
        res.writeHead(500);
        return res.end("Proxy error");
      }
    });
    return;
  }
  const file = join(PUBLIC, path);
  if (!existsSync(file)) {
    res.writeHead(404);
    return res.end("Not found");
  }
  const ext = extname(file);
  res.writeHead(200, { "Content-Type": MIME[ext] || "text/plain" });
  res.end(readFileSync(file));
});

server.listen(PORT, () => {
  console.log(`Control Plane UI on ${PORT}`);
});
