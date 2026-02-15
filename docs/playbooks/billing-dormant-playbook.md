# Billing Dormant Playbook

## Purpose
Keep billing compute available while blocking all external charges and provider webhooks.

## Checks
1. `billing_mode.enabled` is `false`.
2. `billing_mode.allow_external_charges` is `false`.
3. `billing_mode.scopes.invoice_publish` is `false`.
4. `billing_mode.scopes.provider_webhooks` is `false`.

## Validation
- `node scripts/ci/test-billing-dormant-blocks-publish.mjs`
- `node scripts/ci/test-billing-webhook-disabled.mjs`
