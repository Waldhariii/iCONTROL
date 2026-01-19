#!/usr/bin/env node
const fs = require("fs");
const path = require("path");

const checks = [
  {
    id: "dispatch-moduleLoader",
    file: "app/src/moduleLoader.ts",
    must: ["rid", "logs", "renderLogsPage(root)"]
  },
  {
    id: "nav-shell",
    file: "platform-services/ui-shell/layout/shell.ts",
    must: ["hash:\"#/logs\"", "id:\"logs\""]
  },
  {
    id: "dashboard-cta",
    file: "app/src/pages/cp/dashboard.ts",
    must: ["window.location.hash = \"#/logs\""]
  },
  {
    id: "logs-export",
    file: "modules/core-system/ui/frontend-ts/pages/logs/index.ts",
    must: ["export function renderLogsPage", "renderLogsPageAsync"]
  }
];

let failed = false;
for (const check of checks) {
  const filePath = path.resolve(process.cwd(), check.file);
  if (!fs.existsSync(filePath)) {
    console.error(`[logs-route-check] missing file: ${check.file}`);
    failed = true;
    continue;
  }
  const content = fs.readFileSync(filePath, "utf8");
  for (const needle of check.must) {
    if (!content.includes(needle)) {
      console.error(`[logs-route-check] missing pattern '${needle}' in ${check.file}`);
      failed = true;
    }
  }
}

if (failed) {
  process.exit(1);
}
console.log("[logs-route-check] OK");
