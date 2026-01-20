const fs = require("fs");

const checks = [
  "check:created-at",
  "check:paid-killswitch",
  "check:runtime-config-contract",
  "check:safe-mode",
];

const pkg = JSON.parse(fs.readFileSync("package.json","utf8"));
const scripts = pkg.scripts || {};

let ok = 0;
checks.forEach(c => {
  if (scripts[c]) ok++;
});

const score = Math.round((ok / checks.length) * 100);
console.log(`[GOVERNANCE_SCORE] ${score}% (${ok}/${checks.length})`);

if (score < 100) {
  console.warn("[WARN_ONLY] governance score < 100%");
  process.exit(0);
}

console.log("[OK] governance score perfect");
process.exit(0);
