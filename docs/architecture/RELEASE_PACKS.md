# Release Packs

## Purpose
Release Packs provide a signed, portable bundle of a platform release for air‑gapped import, DR drills, and controlled activation.

## Pack Contents
- `pack.json` (schema `release_pack.v1`)
- `pack.sig` (Ed25519 signature)
- `manifests/` (signed manifest and related artifacts)
- `snapshots/compat.json` (compat snapshot)
- `evidence/` (minimal evidence: security posture, SLO snapshot, gates snapshot)
- `assets/` (optional; only referenced assets)

## Invariants
- Manifest signature must verify.
- Pack signature must verify.
- Checksums must match.
- Import is staged and only activated via changeset if gates pass.
- No secrets in pack; scanner enforced.

## Air‑Gap Workflow
1. Export pack on source environment.
2. Verify pack offline (`verify-pack-offline.mjs`).
3. Import to staging (`import-release-pack.mjs --mode staging`).
4. Run gates and activate via changeset (`--mode activate`).

