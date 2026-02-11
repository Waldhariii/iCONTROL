# EVENT BACKBONE V1 (Outbox + Replay) — Canonique

## Objectif plateforme
Standardiser l’émission d’événements *append-only* avec relecture déterministe, tenant-safe, sans dépendance aux surfaces.

## Invariants
- Aucun side-effect à l’import.
- `core-kernel` ne dépend jamais de `app/` ni `server/`.
- `emit()` applique un minimum d’invariants (id, tenantId, type, ts).
- `outbox` = sérialisation stable (payloadJson).
- `replay()` renvoie en ordre déterministe (ts asc, id tie-break).

## API (contract-first)
- `EventEnvelope`
- `EventStore.append()` / `EventStore.scan()`
- `EventBus.emit()` / `EventBus.replay()`

## Implémentation v1
- `MemoryEventStore` (dev/test)
- `createEventBus(store)` (emit + replay)

## Next moves (v2)
- Outbox durable (sqlite/postgres) via `EventStore` impl
- Idempotency keys + dedupe optionnel (store-level)
- Outbox drain worker + backpressure (Write Governor)
- Retention/prune policy + audit hashing integration
