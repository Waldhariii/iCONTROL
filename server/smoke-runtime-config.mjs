#!/usr/bin/env node
/**
 * Smoke test for runtime-config server (SSOT)
 * Tests all endpoints: runtime-config, route-catalog, static files, SPA fallback
 */

import { spawn } from "node:child_process";
import http from "node:http";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "node:fs";
import { info, warn, err } from "./log.mjs";

function dumpServerLogs(serverProcess, logPath) {
  try {
    const parts = [];
    parts.push("=== DIAG: pid ===");
    parts.push(String(serverProcess?.pid || "n/a"));
    parts.push("");
    if (logPath && fs.existsSync(logPath)) {
      parts.push("=== DIAG: log file ===");
      parts.push(logPath);
      parts.push(fs.readFileSync(logPath, "utf8").slice(-8000));
      parts.push("");
    } else {
      parts.push("=== DIAG: log file absent ===");
      parts.push(String(logPath || "n/a"));
      parts.push("");
    }
    const out = parts.join("\n");
    // eslint-disable-next-line no-console
    err("ERR_SMOKE_LOG", "smoke-runtime-config", "stderr", { detail: String(out) });
  } catch (e) {
    // eslint-disable-next-line no-console
    err("ERR_SMOKE_LOG", "smoke-runtime-config", "stderr", { detail: String("dumpServerLogs failed:", e) });
  }
}

// Readiness helper: poll /api/health (no log dependency, no timing dependency)
// Uses local fetch() function defined below
async function waitForHealth(baseUrl, { attempts = 25, delayMs = 120 } = {}) {
  let lastErr = null;
  for (let i = 0; i < attempts; i += 1) {
    try {
      const r = await fetch(`${baseUrl}/api/health`);
      if (r.status === 200) return;
      lastErr = new Error(`health not ok: ${r.status}`);
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw lastErr || new Error("health timeout");
}


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname);
const repoRoot = path.resolve(serverRoot, "..");
const serverPath = path.join(serverRoot, "dist", "runtime-config-server.mjs");

const GLOBAL_TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || "15000");
const LOG_PATH = process.env.SMOKE_LOG_PATH || "/tmp/rcs.smoke.log";

function withTimeout(promise, ms, label = "timeout") {
  return new Promise((resolve, reject) => {
    const to = setTimeout(() => reject(new Error(`${label}: ${ms}ms`)), ms);
    promise.then((v) => { clearTimeout(to); resolve(v); }, (e) => { clearTimeout(to); reject(e); });
  });
}

const TEST_PORT_BASE = Number(process.env.SMOKE_PORT || process.env.PORT || "4178");
const PORT_CANDIDATES = Array.from({ length: 8 }, (_, i) => TEST_PORT_BASE + i);
const TEST_HOST = "127.0.0.1";

let serverProcess = null;
let currentTestPort = TEST_PORT_BASE;
let currentBaseUrl = `http://${TEST_HOST}:${currentTestPort}`;

function startServer() {
  return new Promise((resolve, reject) => {
    // Try ports in order
    const tryPort = (portIndex) => {
      if (portIndex >= PORT_CANDIDATES.length) {
        reject(new Error("All ports exhausted"));
        return;
      }

      const port = PORT_CANDIDATES[portIndex];
      currentTestPort = port;
      currentBaseUrl = `http://${TEST_HOST}:${port}`;

      const logFd = fs.openSync(LOG_PATH, "a");
      serverProcess = spawn("node", [serverPath, "--dev"], {
        env: { ...process.env, PORT: String(port), HOST: TEST_HOST },
        stdio: ["ignore", logFd, logFd],
      });

      serverProcess.on("error", (err) => {
        if (err.code === "EADDRINUSE") {
          // Try next port
          tryPort(portIndex + 1);
        } else {
          reject(err);
        }
      });

      // Use health endpoint to detect readiness (no stdout/stderr available when redirected)
      waitForHealth(currentBaseUrl, { attempts: 30, delayMs: 200 })
        .then(() => {
          setTimeout(resolve, 300); // Give server a moment to be fully ready
        })
        .catch((err) => {
          // If it's a connection error and we haven't waited long, might be port conflict
          if (err.message.includes("ECONNREFUSED") || err.message.includes("EADDRINUSE")) {
            if (portIndex + 1 < PORT_CANDIDATES.length) {
              serverProcess.kill();
              tryPort(portIndex + 1);
            } else {
              reject(new Error(`Server health check failed: ${err.message}`));
            }
          } else {
            reject(new Error(`Server health check failed: ${err.message}`));
          }
        });
    };

    tryPort(0);
  });
}

function stopServer() {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
}

function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = http.request(url, options, (res) => {
      let body = "";
      res.on("data", (chunk) => {
        body += chunk;
      });
      res.on("end", () => {
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body,
        });
      });
    });
    req.on("error", reject);
    if (options.body) {
      req.write(options.body);
    }
    req.end();
  });
}

async function test(name, fn) {
  try {
    await fn();
    info("INFO_SMOKE_STEP", "smoke-runtime-config", name);
    return true;
  } catch (err) {
    dumpServerLogs(serverProcess, LOG_PATH);
    err("ERR_SMOKE_STEP_FAILED", "smoke-runtime-config", `${name}: ${err.message}`);
    return false;
  }
}

async function runTests() {
  info("INFO_SMOKE_START", "smoke-runtime-config", "starting");

  // Start server
  try {
    await startServer();
    info("INFO_SMOKE_SERVER_STARTED", "smoke-runtime-config", "server started");
  } catch (err) {
    dumpServerLogs(serverProcess, LOG_PATH);
    err("ERR_SMOKE_LOG", "smoke-runtime-config", "stderr", { detail: String("❌ Failed to start server:", err) });
    process.exit(1);
  }

  let passed = 0;
  let failed = 0;

  // Test 0: /api/health (readiness + SSOT header)
  if (
    await test("GET /api/health returns 200 + SSOT header", async () => {
      const r = await fetch(`${currentBaseUrl}/api/health`);
      if (r.status !== 200) throw new Error(`health status ${r.status}`);
      const hdr = r.headers["x-icontrol-ssot"];
      if (hdr !== "1") throw new Error(`missing/invalid X-ICONTROL-SSOT header: ${hdr}`);
      const data = JSON.parse(r.body);
      if (data.status !== "ok" || data.ssot !== 1) {
        throw new Error("Invalid health response format");
      }
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 0b: /healthz (readiness + SSOT header)
  if (
    await test("GET /healthz returns 200 + SSOT header", async () => {
      const r = await fetch(`${currentBaseUrl}/healthz`);
      if (r.status !== 200) throw new Error(`healthz status ${r.status}`);
      const hdr = r.headers["x-icontrol-ssot"];
      if (hdr !== "1") throw new Error(`missing/invalid X-ICONTROL-SSOT header: ${hdr}`);
      const data = JSON.parse(r.body);
      if (data.status !== "ok" || data.ssot !== 1) {
        throw new Error("Invalid healthz response format");
      }
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 1: /app/api/runtime-config
  if (
    await test("GET /app/api/runtime-config returns 200", async () => {
      const res = await fetch(`${currentBaseUrl}/app/api/runtime-config`);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const data = JSON.parse(res.body);
      if (!data.app_base_path || !data.cp_base_path) {
        throw new Error("Missing required fields in runtime-config");
      }
      if (res.headers["x-icontrol-ssot"] !== "1") {
        throw new Error("Missing X-ICONTROL-SSOT header");
      }
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 2: /cp/api/runtime-config
  if (
    await test("GET /cp/api/runtime-config returns 200", async () => {
      const res = await fetch(`${currentBaseUrl}/cp/api/runtime-config`);
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
      const data = JSON.parse(res.body);
      if (!data.app_base_path || !data.cp_base_path) {
        throw new Error("Missing required fields in runtime-config");
      }
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Test 3: /app/api/route-catalog (if file exists, else 404)
  const routeCatalogPath = path.resolve(repoRoot, "config", "ssot", "ROUTE_CATALOG.json");
  const catalogExists = fs.existsSync(routeCatalogPath);

  if (catalogExists) {
    if (
      await test("GET /app/api/route-catalog returns 200 (file exists)", async () => {
        const res = await fetch(`${currentBaseUrl}/app/api/route-catalog`);
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const data = JSON.parse(res.body);
        if (!data.routes || !Array.isArray(data.routes)) {
          throw new Error("Invalid route catalog format");
        }
        if (data.routes.some((r) => r?.app_surface === "CP")) {
          throw new Error("APP route-catalog polluted with CP routes");
        }
        if (data.routes.some((r) => String(r?.route_id || "").endsWith("_cp"))) {
          throw new Error("APP route-catalog contains _cp route_id");
        }
        if (res.headers["x-icontrol-ssot"] !== "1") {
          throw new Error("Missing X-ICONTROL-SSOT header");
        }
      })
    ) {
      passed++;
    } else {
      failed++;
    }
  } else {
    if (
      await test("GET /app/api/route-catalog returns 404 (file missing)", async () => {
        const res = await fetch(`${currentBaseUrl}/app/api/route-catalog`);
        if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
        const data = JSON.parse(res.body);
        if (data.code !== "ERR_ROUTE_CATALOG_NOT_FOUND") {
          throw new Error(`Expected ERR_ROUTE_CATALOG_NOT_FOUND, got ${data.code}`);
        }
      })
    ) {
      passed++;
    } else {
      failed++;
    }
  }

  // Test 4: /cp/api/route-catalog (if file exists, else 404)
  if (catalogExists) {
    if (
      await test("GET /cp/api/route-catalog returns 200 (file exists)", async () => {
        const res = await fetch(`${currentBaseUrl}/cp/api/route-catalog`);
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        const data = JSON.parse(res.body);
        if (!data.routes || !Array.isArray(data.routes)) {
          throw new Error("Invalid route catalog format");
        }
        if (data.routes.some((r) => r?.app_surface === "CLIENT")) {
          throw new Error("CP route-catalog polluted with CLIENT routes");
        }
        if (data.routes.some((r) => String(r?.route_id || "").endsWith("_app"))) {
          throw new Error("CP route-catalog contains _app route_id");
        }
        if (res.headers["x-icontrol-ssot"] !== "1") {
          throw new Error("Missing X-ICONTROL-SSOT header");
        }
      })
    ) {
      passed++;
    } else {
      failed++;
    }
  } else {
    if (
      await test("GET /cp/api/route-catalog returns 404 (file missing)", async () => {
        const res = await fetch(`${currentBaseUrl}/cp/api/route-catalog`);
        if (res.status !== 404) throw new Error(`Expected 404, got ${res.status}`);
        const data = JSON.parse(res.body);
        if (data.code !== "ERR_ROUTE_CATALOG_NOT_FOUND") {
          throw new Error(`Expected ERR_ROUTE_CATALOG_NOT_FOUND, got ${data.code}`);
        }
      })
    ) {
      passed++;
    } else {
      failed++;
    }
  }

  // Test 5: /app/ returns HTML (requires dist/app/index.html)
  const appDistPath = path.resolve(repoRoot, "dist", "app", "index.html");
  const appDistExists = fs.existsSync(appDistPath);

  if (appDistExists) {
    if (
      await test("GET /app/ returns HTML (200)", async () => {
        const res = await fetch(`${currentBaseUrl}/app/`);
        if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`);
        if (!res.headers["content-type"]?.includes("text/html")) {
          throw new Error("Expected HTML content-type");
        }
        if (!res.body.includes("<!DOCTYPE html>") && !res.body.includes("<html")) {
          throw new Error("Response is not HTML");
        }
        if (res.headers["cache-control"] !== "no-store") {
          throw new Error("HTML should have no-store cache-control");
        }
      })
    ) {
      passed++;
    } else {
      failed++;
    }

    // Test 6: SPA fallback - /app/does-not-exist returns index.html
    if (
      await test("GET /app/does-not-exist returns index.html (SPA fallback)", async () => {
        const res = await fetch(`${currentBaseUrl}/app/does-not-exist`);
        if (res.status !== 200) throw new Error(`Expected 200 (SPA fallback), got ${res.status}`);
        if (!res.headers["content-type"]?.includes("text/html")) {
          throw new Error("Expected HTML content-type for SPA fallback");
        }
      })
    ) {
      passed++;
    } else {
      failed++;
    }
  } else {
    warn("WARN_SMOKE_SKIP_STATIC", "smoke-runtime-config", "skipping static file tests (dist/app/index.html not found)");
  }

  // Test 7: Root redirect
  if (
    await test("GET / redirects to /app/ (302)", async () => {
      const res = await fetch(`${currentBaseUrl}/`, { method: "GET", followRedirect: false });
      if (res.status !== 302) throw new Error(`Expected 302, got ${res.status}`);
      if (res.headers.location !== "/app/") {
        throw new Error(`Expected Location: /app/, got ${res.headers.location}`);
      }
    })
  ) {
    passed++;
  } else {
    failed++;
  }

  // Cleanup
  stopServer();

  info("INFO_SMOKE_RESULTS", "smoke-runtime-config", "results", { passed, failed });

  if (failed > 0) {
    err("ERR_SMOKE_LOG", "smoke-runtime-config", "stderr", { detail: String("\n❌ ERR_SMOKE_FAILED: Smoke tests failed") });
    process.exit(1);
  } else {
    info("INFO_SMOKE_PASSED", "smoke-runtime-config", "all tests passed");
    process.exit(0);
  }
}

// Handle cleanup on exit
process.on("SIGINT", () => {
  stopServer();
  process.exit(1);
});
process.on("SIGTERM", () => {
  stopServer();
  process.exit(1);
});

withTimeout(runTests(), GLOBAL_TIMEOUT_MS, "smoke-global").catch((err) => {
  err("ERR_SMOKE_LOG", "smoke-runtime-config", "stderr", { detail: String("Fatal error:", err) });
  err("ERR_SMOKE_LOG", "smoke-runtime-config", "stderr", { detail: String("ERR_SMOKE_FAILED: Smoke test execution failed") });
  dumpServerLogs(serverProcess, LOG_PATH);
  stopServer();
  process.exit(1);
});
