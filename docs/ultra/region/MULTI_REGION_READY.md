# Multi-Region Ready — Ultra Program

## Target state
- RegionPolicy (contract-first) décide routing + storage residency.
- Aucune dépendance UI -> region logic (only via platform-services interface).
- Future: multi-cluster + failover + read replicas.

## Files
- core-kernel/src/region/regionPolicy.contract.ts
- core-kernel/src/region/regionPolicy.ts
