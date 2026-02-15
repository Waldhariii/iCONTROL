# Billing Activation (Dormant by Default)

## Model
- Billing is **disabled** by default via `platform/ssot/billing/billing_mode.json`.
- Rating rules map FinOps usage meters to invoice line items.
- Runtime computes **draft invoices only** when dormant.

## Activation
- Requires quorum approval (`billing.activate` review) and explicit switch:
  - `billing_mode.enabled = true`
  - `billing_mode.allow_external_charges = true`
  - `billing_mode.scopes.invoice_publish = true`
  - `billing_mode.scopes.provider_webhooks = true`

## Invariants
- No external charge/webhook when dormant.
- All billing behavior is manifest-driven.
- Drafts are runtime-only and ignored by git.
