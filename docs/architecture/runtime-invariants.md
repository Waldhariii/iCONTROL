# Runtime Invariants

- Runtime loads only `platform_manifest.<release>.json` with valid signature.
- No runtime execution outside signed manifest.
- Cache staleness budget enforced by loader.
- All SSOT writes are applied via changesets with atomic patch engine.
