# Webhook Signing Playbook

## Required Headers (Inbound)
- `x-request-id`
- `x-timestamp` (unix ms)
- `x-signature` (base64)

## Canonical Signature
```
${timestamp}.${rawBody}
```
HMAC-SHA256 with active ref bound to `webhook_signing`.

## Replay Window
- Default: 5 minutes (`replay_window_ms` in `secret_policies.json`).
- Requests outside window are denied.

## Troubleshooting
1. Ensure `secret_bindings.json` contains `webhook_signing` binding for scope.
2. Confirm `ENV`/`FILE` secret exists (no value exposure).
3. Check policy decision logs and `runtime/reports/index/webhook_verify.jsonl`.
