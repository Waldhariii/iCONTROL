# S2S Auth Playbook

## Modes
- **Direct HMAC**: headers `x-s2s-principal`, `x-s2s-timestamp`, `x-s2s-signature`.
- **Token Exchange**: obtain short-lived token via `/api/auth/token`, then use `Authorization: Bearer <token>`.

## HMAC Canonical String
```
${timestamp}.${method}.${path}.${bodySha256}
```

## Token Exchange
1. Call `POST /api/auth/token` using HMAC.
2. Provide `principal_id`, `requested_scopes`, `audience`.
3. Use `access_token` for subsequent calls.

## Scope Rules
- Requested scopes must be subset of:
  - principal allowed_scopes
  - token exchange policy allowlist

## Failure Reasons
- `missing_headers`, `invalid_signature`, `replay_window`, `scope_not_allowed`, `token_expired`
