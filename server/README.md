# Runtime Config Server (SSOT)

## Single Source of Truth

**SSOT = `server/runtime-config-server.ts` → `server/dist/runtime-config-server.mjs`**

This is the ONLY authoritative implementation. All other files (including `runtime-config-server.js`) are wrappers or legacy code.

## Readiness Contract

The server exposes two health endpoints that are **always available** (no async dependencies):

- `GET /api/health` → HTTP 200 + `X-ICONTROL-SSOT: 1` header
- `GET /healthz` → HTTP 200 + `X-ICONTROL-SSOT: 1` header

Both endpoints return:
```json
{
  "status": "ok",
  "service": "runtime-config-server",
  "ssot": 1,
  "version": 1
}
```

## Routing Order (STRICT and IMMUTABLE)

1. `/api/health`
2. `/healthz`
3. `/app/api/runtime-config`
4. `/cp/api/runtime-config`
5. `/app/api/route-catalog`
6. `/cp/api/route-catalog`
7. Static `/app` (with SPA fallback to `index.html`)
8. Static `/cp` (with SPA fallback to `index.html`)

**Important**: The SPA fallback ensures that any unknown route under `/app/*` or `/cp/*` returns `index.html` if present, enabling client-side routing.

## Commands

### Development
```bash
npm run server:dev
```

### Build
```bash
npm run server:build
```

### Production
```bash
npm run server:prod
```

### Local Web Serve
```bash
npm run local:web:serve
```

### Smoke Tests

**Command**: `npm run server:smoke`

**Environment Variables** (optional):
- `SMOKE_TIMEOUT_MS` (default: 15000) - Global timeout for all tests
- `SMOKE_PORT` (default: 4178) - Starting port (auto-retries on collision)
- `SMOKE_LOG_PATH` (default: /tmp/rcs.smoke.log) - Server log file location

**What it tests**:
- `/api/health` and `/healthz` return 200 + SSOT header
- All API endpoints return 200 with correct headers
- SPA fallback works correctly
- Static file serving with proper cache headers

## Dev Gates

### Pre-commit Hook

The SSOT server is protected by pre-commit gates that run automatically before each commit:

1. **Invariants check** (always runs): Verifies routing order and wrapper purity
2. **Smoke tests** (conditional): Only runs if `server/`, `dist/`, or `package.json` files are modified

To install the git hooks:

```bash
npm run hooks:install
```

This configures git to use the hooks in `.githooks/`. The pre-commit hook will:
- Run SSOT invariants (fast, always)
- Run smoke tests only if server files changed (slower, conditional)

### CI/CD

The server SSOT is validated in CI via `.github/workflows/server-ssot.yml`:

- Runs on every PR and push to main/master/develop
- Executes: `npm run server:ci` (invariants + build + smoke)
- Fails the build if any check fails (merge blocker)

### Error Codes

Standardized error codes for monitoring and debugging:

- `ERR_SSOT_INVARIANT_FAILED`: Invariant checks failed (routing order or wrapper purity)
- `ERR_SMOKE_FAILED`: Smoke tests failed (server functionality issue)
- `ERR_RUNTIME_CONFIG_SERVER`: Runtime server error (already in use)

## Legacy Files

- `server/runtime-config-server.js` - **DEPRECATED**: Pure wrapper that delegates to SSOT. Contains NO business logic.


## Log contract (SSOT)
- Format: JSONL strict (one JSON object per line)
- Champs: ts, level, code, scope, message, context
- Codes: INFO_*, WARN_*, ERR_*
- Interdit: console.log/info/warn/error dans les scripts SSOT (sauf wrapper legacy `runtime-config-server.js`)
- Gate: `npm run -s server:invariants` échoue si le contrat est violé
