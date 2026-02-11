# WORLD-CLASS SYSTEM SPEC (Canonical)

## Mission
Deliver a modular, multi-tenant platform with:
- deterministic governance (SSOT, SAFE_MODE, RBAC, writeGateway-only)
- zero-trust boundaries (no cross-layer imports, safe render, generated-only artifacts)
- extreme operability (tag-integrity, release evidence, rollback simulation)
- extension economy (SDK + marketplace + entitlements)
- pricing engine (usage-based, optional upgrades that do not break free core)
- AI orchestration per-tenant (provider abstraction, auditability, cost controls)

## Canonical Layers (non-negotiable)
1) **core-kernel/**: policy, contracts, pressure/write governor, queues, circuit breaker, auth/session primitives
2) **platform-services/**: storage providers, observability, billing, AI orchestrator, chaos, release tooling
3) **shared/**: pure adapters, types, deterministic helpers, no side effects
4) **modules/**: business UI + domain APIs (no import from app/src or server/src)
5) **app/**: surfaces (APP/CP), routing, rendering, platform adapters usage only (no direct localStorage)
6) **server/**: backend runtime (future), migrations, tests

## Hard Rules (enforced by gates)
- NO parallel roots (app2, backend, frontend, legacy, copy, etc.)
- generated-only: _artifacts/, _audit/ never tracked
- Modules cannot depend on app/src or server/src
- Storage writes only via platform storage adapter (webStorage/VFS/writeGateway)
- No import-time side effects (no navigate(), no writes, no init)
- Release chain: tag-set-atomic before any prod validation; tags drift is a hard fail

## Strategic Moves (best-in-world roadmap)
A) Platform API + SDK (extensions registry)  
B) Tenant self-provisioning + policy engine  
C) Billing usage-based + cost engine  
D) Observability: tenant health + SLOs + budget gates  
E) AI Orchestrator: audited, cost-capped, multi-provider  
F) Chaos / antifragility (safe-mode drills, rollback drills)
