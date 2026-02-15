# Studio Module Authoring

## Overview
Studio can create and manage domain modules via changesets only. Modules compile into the manifest and activate per tenant.

## Flow
1. Draft changeset
2. Preview compile + gates
3. Publish -> release signed
4. Activate tenant scope (module_activations)

## Governance
- Quorum for publish/activate
- Freeze scopes: content mutations remain blocked; studio UI exception is governed
- NoFallback enforced

## Preview Isolation
Preview artifacts live under `platform/runtime/preview/<changesetId>` and never overwrite active release.
