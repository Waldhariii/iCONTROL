# Runtime Invariants

- Runtime loads only `platform_manifest.<release>.json` with valid signature.
- No runtime execution outside signed manifest.
- Cache staleness budget enforced by loader.
- All SSOT writes are applied via changesets with atomic patch engine.
- Control Plane (CP) is the manufacturer console; all SSOT operations go through changesets.
- Client runtime continues serving the last active release even if CP is unavailable.
