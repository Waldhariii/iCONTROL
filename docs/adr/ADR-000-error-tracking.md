# ADR-000: Error Tracking avec Error Tracker Custom

**Date**: 2024-01-XX  
**Statut**: Accepté  
**Décideurs**: Équipe technique

## Contexte

Nous avions besoin d'un système de tracking d'erreurs robuste pour capturer et analyser les erreurs en production, similaire à Sentry mais adapté à nos besoins.

## Décision

Implémenter un error tracker custom avec:
- Capture automatique des erreurs non gérées
- Breadcrumbs pour contexte
- Groupement intelligent
- Persistance localStorage pour diagnostic
- Structure extensible pour intégration Sentry future

## Conséquences

### Positives
- Visibilité complète des erreurs en production
- Contexte riche pour debugging
- Pas de dépendance externe immédiate
- Facile à étendre avec Sentry plus tard

### Négatives
- Maintenance d'un système custom
- Pas d'alerting automatique externe (à ajouter)

## Alternatives considérées

1. **Sentry direct**: Trop de setup initial, préféré commencer custom
2. **LogRocket**: Coûteux, overkill pour nos besoins initiaux
3. **Custom minimal**: Pas assez de contexte

## Implémentation

- `app/src/core/errors/errorTracker.ts`
- Intégration dans `main.ts`
- Breadcrumbs automatiques
- Sauvegarde localStorage
