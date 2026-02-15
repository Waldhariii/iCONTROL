# Secrets Zero-Trust Playbook

## Principles
- Secrets never appear in SSOT, manifests, reports, logs, or evidence packs.
- SSOT stores only references (`sec:ref:*`) with providers like `env` or `file`.
- Runtime resolves refs to handles only; values are never exposed.

## Allowed Providers
- `env`: environment variable exists check only.
- `file`: file existence check only (no content logged).
- `vault`/`kms`: stubbed handle (format validation only).

## Operational Steps
1. Create a new secret ref in `platform/ssot/security/secrets_vault_refs.json` via changeset.
2. Bind ref to usage in `secret_bindings.json` with a rotation policy.
3. Validate SSOT, compile, and run gates.
4. Verify `/api/security/secrets/status` shows `health=ok`.

## Incident Response
- If a secret is exposed, rotate immediately using the rotation runner.
- If NoSecrets gate fails, follow `no-secrets-response-playbook.md`.
