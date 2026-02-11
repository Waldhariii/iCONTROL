# core-kernel/contracts

Contract-first boundary.
All modules and surfaces depend on contracts, not implementations.

Principles:
- No import-time side effects.
- Contracts are stable, versioned, and audited.
- Implementations live in core-kernel/src/** or platform-services/**.
