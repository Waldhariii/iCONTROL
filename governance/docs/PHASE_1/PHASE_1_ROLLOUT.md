# PHASE 1 — Write Gateway Rollout

## Rollout Stages
1) **OFF (default)**
   - Flag: `write_gateway_shadow = OFF`.
   - All writes use legacy paths.

2) **SHADOW (pilot)**
   - Flag: `write_gateway_shadow = ON` or `ROLLOUT`.
   - Pilot command(s) routed through Write Gateway; legacy path used only on fallback.

3) **CANARY**
   - Expand command coverage to additional low-risk writes.
   - Observe logs and coverage report for drift.

4) **ON**
   - Switch pilot commands to gateway only (legacy retained as fallback during transition).

## Rollback
- Set `write_gateway_shadow = OFF`.
- Legacy paths remain intact; no destructive changes in Phase 1.
