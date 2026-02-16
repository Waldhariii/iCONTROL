# Core Platform Freeze — Level 11

**Status:** STRATEGIC INFRASTRUCTURE (frozen)

The core is now considered **strategic infrastructure**. Any modification requires explicit governance.

---

## Required for any core change

- ✔ Architecture Decision Record (ADR)
- ✔ Impact analysis
- ✔ GAReadinessGate PASS
- ✔ IsolationGate PASS
- ✔ DriftGate PASS
- ✔ ManifestFingerprintGate PASS
- ✔ ReleaseOpsGate PASS

Commit message must contain **ADR-APPROVED** when touching protected paths.

---

## Forbidden without ADR

The following paths are **protected**. Changes require an ADR and the gates above.

- `runtime/`
- `compilers/`
- `gates/`
- SSOT engine
- Tenant factory
- Release system
- Adapters
- Workflow runner
- Scheduler
- Isolation layer
- DataGov layer

**If a change touches these paths → BLOCK CI** (platformFreezeGate fails unless ADR-APPROVED).

---

## Platform semver (platform/VERSION)

- **MAJOR:** Breaking architecture change only.
- **MINOR:** New platform capability.
- **PATCH:** Security / gate / deterministic fix.

Core changes require a version bump; MAJOR requires ADR-APPROVED.

---

## Build ON it. Never IN it.

Treat the platform like AWS treats its control plane: **stable**, **predictable**, **untouchable**.

Next program: **BUSINESS SURFACES** (CRM, Billing, Documents, Accounting, Industry packs, Vertical extensions) — always via **extensions**, never inside core.
