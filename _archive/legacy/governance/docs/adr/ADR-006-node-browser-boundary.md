# ADR-006 — Node/Browser boundary enforced

Date: 2026-02-01  
Status: Accepted  
Owners: CTO / Platform

## Context
Importing Node core modules into browser build creates build failures or hidden polyfills.

## Decision
Node-only code lives under explicit `*/node/*` folders.
Browser runtime must not import Node core modules.
Runtime config loader is Node-only; browser uses snapshots.

## Rationale
Prevents accidental bundling of Node dependencies and keeps builds deterministic.

## Consequences
- (+) Stable builds, clean separation of concerns
- (-) Requires explicit entrypoints for Node runtime

## Enforcement
- gate:no-node-in-browser
- boundaries gates

## Rollback
Any relaxation must be explicit via ADR and gated with strict tests.
