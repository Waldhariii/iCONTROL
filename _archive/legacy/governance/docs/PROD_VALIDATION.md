# PROD validation (local)

## What to run

Use the **built** runtime server entrypoint for production-equivalent validation.

Why: the TS entrypoint can be sensitive to cwd/path resolution in dev mode; the built server reflects prod layout and avoids false 404s.

## Checks
- `/assets/*` returns 200
- Back-compat: `/app/assets/*` and `/cp/assets/*` return 200
- Byte-level SHA256 from HTTP matches local `dist/assets/*`
