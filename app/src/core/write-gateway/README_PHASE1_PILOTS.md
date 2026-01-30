# Phase 1.1 Pilot candidates (shadow)
This file is intentionally declarative and does not change runtime behavior.
Next low-risk shadow command candidates (confirm exact write entrypoints before wiring):
- RUNTIME_CONFIG_SET (target: runtime config persistence)
- AUDIT_APPEND_SHADOW (target: audit append-only path)
Rule: wire only after identifying exact function+file; keep legacy write as fallback.
