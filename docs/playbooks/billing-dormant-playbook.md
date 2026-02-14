# Billing Dormant Playbook

## Purpose
Keep metering and budgets active while **disabling payment flows**.

## Current State
- Metering is compiled into the platform manifest.
- Usage is recorded locally in runtime output.
- Budget thresholds create audit events only.
- No invoices or payment collection exist.

## How to Activate Billing Later (No Refactor)
1. Introduce a billing service that **reads** usage and rate cards.
2. Keep Write Gateway enforcement unchanged.
3. Add an invoicing pipeline as a separate, audited extension.
4. Gate activation by policy and quorum.

## Guardrails
- Never bypass manifest signatures.
- Keep rate cards versioned and approved in SSOT.
