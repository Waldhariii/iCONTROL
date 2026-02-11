# ADR-003 — Write Gateway mandatory for writes

Date: 2026-02-01  
Status: Accepted  
Owners: CTO / Platform

## Context
Direct writes (storage/network) scattered across runtime code are hard to audit and easy to regress.

## Decision
All writes must go through `app/src/platform/writeGateway.ts`.
VFS namespaces enforce tenant boundaries.

## Rationale
Centralizing writes enables audit trails, SAFE_MODE, and deterministic rollback strategies.

## Consequences
- (+) Better governance, observability, and security controls
- (-) Requires adapters/migrations for legacy code paths

## Enforcement
- Gates preventing direct storage writes (where applicable)
- Contract tests around platform policies

## Rollback
If a new write mechanism is introduced, it must remain single-entry and enforce policies equivalently.
