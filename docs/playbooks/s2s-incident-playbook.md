# S2S Incident Playbook

## Symptoms
- 401/403 from backend for service calls
- `s2s.token.use` denies in policy decisions

## Checks
1. Ensure service principal is `active`.
2. Verify credential validity window (not_before/expires_at).
3. Confirm secret ref exists and ENV/file present.
4. Confirm scopes requested are allowed by principal + policy.
5. If `S2S_REQUIRE_MTLS=1`, ensure proxy injects `x-mtls-verified: 1`.

## Remediation
- Rotate credentials if suspect.
- Update scopes via SSOT and release.
- Retry token exchange and validate scope.
