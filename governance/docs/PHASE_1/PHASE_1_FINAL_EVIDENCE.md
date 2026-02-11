# Phase 1 Final Evidence — Runbook

## Proofs (obligatoires)
- npm -s run -S gate:ssot
- npm -s run -S gate:ssot:paths
- npm -s run -S build:cp
- npm -s run -S build:app

## Vérifs rapides (recommandées)
- JSON flags OK:
  - node -e 'JSON.parse(require("fs").readFileSync("app/src/policies/feature_flags.default.json","utf8")); console.log("flags_json_ok")'
- HEAD:
  - git rev-parse HEAD

## Report-only (ne pas committer sauf demande explicite)
- npm -s run -S gate:write-surface-map
- npm -s run -S gate:write-gateway-coverage
Rapports (repo):
- docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS/write_surface_map_report.md
- docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS/write_gateway_coverage_report.md
