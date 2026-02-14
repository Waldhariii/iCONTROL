import http from "http";
import { readFileSync, existsSync } from "fs";
import { extname, join } from "path";

const PORT = process.env.PORT || 6060;
const ROOT = process.cwd();
const PUBLIC = join(ROOT, "apps/control-plane/public");

const MIME = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json"
};

const server = http.createServer((req, res) => {
  let path = req.url === "/" ? "/index.html" : req.url;
  if (path.startsWith("/api/")) {
    res.writeHead(404);
    return res.end("Use backend-api on :7070");
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
