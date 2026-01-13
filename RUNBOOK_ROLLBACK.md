# Runbook — Rollback iCONTROL

## Rollback depuis main (dernier release)
git checkout main
git reset --hard baseline/main-p1.2-cache-observability
git push origin main --force-with-lease

## Rollback vers P1.1 (avant observability)
git checkout main
git reset --hard baseline/p1.1-cache-swr-metrics
git push origin main --force-with-lease

## Notes
- Toujours confirmer les tags avant reset
- Ne jamais forcer sans --force-with-lease
