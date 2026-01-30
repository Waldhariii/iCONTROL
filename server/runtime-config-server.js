/* eslint-disable no-console */
/**
 * LEGACY WRAPPER: This file is deprecated and contains NO business logic.
 * SSOT is server/dist/runtime-config-server.mjs (built from runtime-config-server.ts).
 * 
 * This wrapper ONLY delegates to the SSOT server to maintain backward compatibility.
 * DO NOT add any business logic here. All routing, serving, and configuration
 * must be done in the SSOT TypeScript server.
 */

const { spawn } = require("node:child_process");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const SSOT_SERVER = path.resolve(ROOT, "server", "dist", "runtime-config-server.mjs");

// eslint-disable-next-line no-console
console.warn(
  "⚠️  WARNING: server/runtime-config-server.js is deprecated. Using SSOT server instead.",
);
// eslint-disable-next-line no-console
console.warn(
  "   SSOT: server/dist/runtime-config-server.mjs (built from runtime-config-server.ts)",
);

// Build SSOT if needed
const fs = require("node:fs");
if (!fs.existsSync(SSOT_SERVER)) {
  // eslint-disable-next-line no-console
  console.log("🔨 Building SSOT server...");
  const { execSync } = require("node:child_process");
  try {
    execSync("npm run server:build", { stdio: "inherit", cwd: ROOT });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("❌ Failed to build SSOT server:", err);
    process.exit(1);
  }
}

// Delegate to SSOT server (ONLY purpose of this file)
const child = spawn("node", [SSOT_SERVER], {
  stdio: "inherit",
  env: { ...process.env },
});

child.on("error", (err) => {
  // eslint-disable-next-line no-console
  console.error("❌ Failed to start SSOT server:", err);
  process.exit(1);
});

process.on("SIGINT", () => {
  child.kill();
  process.exit(0);
});
process.on("SIGTERM", () => {
  child.kill();
  process.exit(0);
});

// NO business logic below this line
// This file is a pure wrapper that delegates to the SSOT server
