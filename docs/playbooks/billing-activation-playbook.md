# Billing Activation Playbook

## Preconditions
- Quorum approval recorded for `billing.activate` targeting `billing_mode`.
- Confirm DLP/DataGov export rules for invoices.

## Steps
1. Update `platform/ssot/billing/billing_mode.json`:
   - set `enabled: true`
   - set `allow_external_charges: true`
   - set `scopes.invoice_publish: true`
   - set `scopes.provider_webhooks: true`
2. Run preview compile and gates.
3. Publish and activate release.
4. Verify:
   - `/api/billing/invoices/publish` works
   - `/api/billing/providers/:id/webhook` accepts

## Rollback
- Revert to dormant mode and re-publish.
