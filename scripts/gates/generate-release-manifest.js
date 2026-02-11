#!/usr/bin/env node
const fs = require("fs");
const { execSync } = require("child_process");

function sh(cmd){
  return execSync(cmd,{encoding:"utf8"}).trim();
}

const out = {
  ts: new Date().toISOString(),
  branch: sh("git rev-parse --abbrev-ref HEAD"),
  head: sh("git rev-parse --short HEAD"),
  node: process.version,
  platform: process.platform,
  dist: fs.existsSync("dist") ? fs.readdirSync("dist") : [],
  app_dist: fs.existsSync("apps/control-plane/dist") ? fs.readdirSync("apps/control-plane/dist") : []
};

fs.writeFileSync(
  "RELEASE_MANIFEST.json",
  JSON.stringify(out,null,2)
);

console.log("OK: RELEASE_MANIFEST.json generated");
