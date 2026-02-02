import { execSync } from "node:child_process";

function rg(q) {
  try {
    return execSync(q, { stdio: ["ignore", "pipe", "ignore"] }).toString("utf8").trim();
  } catch {
    return "";
  }
}

const hits = [
  rg(`rg -n --hidden --glob '!**/node_modules/**' --glob '!**/_audit/**' --glob '!**/*.test.*' --glob '!**/__tests__/**' "(\\btier\\b|\\bplan\\b\\s*===|\\bsubscription\\b\\s*===)" app/src modules || true`)
].join("\n").trim();

if (!hits) {
  console.log("OK: gate:entitlements-scatter-warn (no hits)");
  process.exit(0);
}

console.warn("WARN_ENTITLEMENTS_SCATTER: potential tier/plan checks detected (warn-only).");
console.warn(hits.split("\n").slice(0, 80).join("\n"));
console.log("OK: gate:entitlements-scatter-warn");
