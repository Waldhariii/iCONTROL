#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../.." || exit 1

ts="$(date +%Y-%m-%dT%H:%M:%S%z)"
out="docs/CP_COMPLIANCE_REPORT.md"

echo "# CP Compliance Report" > "$out"
echo "" >> "$out"
echo "- Generated: \`$ts\`" >> "$out"
echo "- Workspace: \`$(pwd)\`" >> "$out"
echo "" >> "$out"

echo "## Guardrails" >> "$out"
echo "" >> "$out"

echo "### cp:devonly:verify" >> "$out"
echo "\`\`\`" >> "$out"
npm run -s cp:devonly:verify >> "$out" 2>&1 || { echo "\`\`\`" >> "$out"; echo "" >> "$out"; echo "**FAIL** cp:devonly:verify" >> "$out"; exit 1; }
echo "\`\`\`" >> "$out"
echo "" >> "$out"

echo "### cp:guard (no inline styles)" >> "$out"
echo "\`\`\`" >> "$out"
./tools/scripts/guard-cp-no-inline-styles.sh >> "$out" 2>&1 || { echo "\`\`\`" >> "$out"; echo "" >> "$out"; echo "**FAIL** cp:guard" >> "$out"; exit 1; }
echo "\`\`\`" >> "$out"
echo "" >> "$out"

echo "## Diagnostic snapshot (DEV-only surface)" >> "$out"
echo "" >> "$out"
echo "Contracted marker: \`ICONTROL_DIAGNOSTIC_V1\`" >> "$out"
echo "" >> "$out"
echo "\`\`\`json" >> "$out"
node - <<'NODE' >> "$out" 2>&1
const w = globalThis;
try {
  const { installIControlDiagnosticDEVOnly } = require("./dist/dev/diagnosticInstall") || {};
  // dist may not exist in dev; fallback to TS import via node (best-effort)
  if (typeof installIControlDiagnosticDEVOnly === "function") installIControlDiagnosticDEVOnly();
} catch {}
try {
  // try importing TS source (vitest env will validate real)
  const m = require("./src/dev/diagnosticInstall.ts");
  if (m && typeof m.installIControlDiagnosticDEVOnly === "function") m.installIControlDiagnosticDEVOnly();
} catch {}
const fn = w.__ICONTROL_DIAGNOSTIC__;
if (typeof fn === "function") {
  const api = fn();
  const snap = (api && typeof api.export === "function") ? api.export() : { ok:false, err:"no export()" };
  console.log(JSON.stringify(snap, null, 2));
} else {
  console.log(JSON.stringify({ ok:false, err:"__ICONTROL_DIAGNOSTIC__ not installed" }, null, 2));
}
NODE
echo "\`\`\`" >> "$out"
echo "" >> "$out"

echo "## Test suite (gate:cp)" >> "$out"
echo "" >> "$out"
echo "\`\`\`" >> "$out"
npm run -s gate:cp >> "$out" 2>&1 || { echo "\`\`\`" >> "$out"; echo "" >> "$out"; echo "**FAIL** gate:cp" >> "$out"; exit 1; }
echo "\`\`\`" >> "$out"
echo "" >> "$out"

echo "OK: wrote $out"
