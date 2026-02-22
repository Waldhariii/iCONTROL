# SSOT — Chemins canoniques (Repo)

## Objectif
Éliminer toute ambigüité sur les chemins attendus par les scripts, gates et procédures Phase 1+.

## Chemins canoniques (SSOT)
- Flags (SSOT): `apps/control-plane/src/policies/feature_flags.default.json`
- Reports (report-only):
  - `governance/docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS/write_surface_map_report.md`
  - `governance/docs/PHASE_1/APPENDIX_COMMAND_OUTPUTS/write_gateway_coverage_report.md`
- FS pilot Phase 1.15:
  - `modules/core-system/subscription/FileSubscriptionStore.node.ts`

## Règles
1. Aucun script ne doit référencer d'autres chemins pour ces artefacts.
2. Les reports sont report-only: régénération acceptable, commit séparé sur demande.
3. Les flags restent OFF par défaut; ON/ROLLOUT seulement en rollout contrôlé.

## Notes
- Éviter `rg -n` pour résoudre des chemins (préfixe `NNN:`). Préférer `rg --files -g`.
