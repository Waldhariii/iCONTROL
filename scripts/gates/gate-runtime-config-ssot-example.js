#!/usr/bin/env node
const fs = require("fs");
const crypto = require("crypto");
function sha(s){ return crypto.createHash("sha256").update(s).digest("hex"); }
function fail(msg){ console.error(msg); process.exit(1); }
function ok(msg){ console.log(msg); }

const root = ".icontrol_subscriptions.example.json";
const app = "app/.icontrol_subscriptions.example.json";

if (!fs.existsSync(root)) fail("ERR_RUNTIME_CONFIG_EXAMPLE_ROOT_MISSING: " + root);
if (!fs.existsSync(app)) fail("ERR_RUNTIME_CONFIG_EXAMPLE_APP_MISSING: " + app);

const a = fs.readFileSync(root, "utf8");
const b = fs.readFileSync(app, "utf8");

if (sha(a) !== sha(b)) {
  fail("ERR_RUNTIME_CONFIG_EXAMPLE_DRIFT: app example differs from root (SSOT violation).");
}

ok("OK: gate:runtime-config-example-ssot");
