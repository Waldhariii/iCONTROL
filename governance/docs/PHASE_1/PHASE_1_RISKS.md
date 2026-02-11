# PHASE 1 — Risks & Mitigations

## Risks
- **Unexpected gateway error** could block a write path in pilot mode.
- **Policy/audit stubs** may hide missing enforcement.
- **Coverage gate noise** may generate false positives.

## Mitigations
- **Safe mode**: gateway errors return controlled errors and log warnings.
- **Shadow fallback**: on gateway failure, legacy write is used.
- **Report-only gate**: starts non-blocking; refine patterns before enforcing.
