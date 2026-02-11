# Architecture — iCONTROL

Objectifs:
- Modulaire, activable/désactivable par module (complémentaire) sans impacter le coeur.
- Gouvernance stricte (RBAC, SAFE_MODE, policy-engine).
- Tolérance aux pannes: si un module fail, l'app reste opérationnelle (safe-render + isolation).
- Multi-langage pragmatique: TS (UI), Python (orchestration/OCR/automation), Go (services perf), Rust (libs critiques).
