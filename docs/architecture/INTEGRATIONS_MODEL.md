# Integrations Model

- Connectors and configs are defined in SSOT under `platform/ssot/integrations/*`.
- Secrets are references only (`secrets_vault_refs.json`), never plaintext.
- Runtime executes only what is in the signed manifest.
- Inbound webhooks require HMAC signature + tenant scope + ABAC.
- Outbound webhooks apply DataGov export controls (masking/deny), retries, and DLQ.
- Events dispatch via the runtime event bus to extensions and outbound webhooks.
