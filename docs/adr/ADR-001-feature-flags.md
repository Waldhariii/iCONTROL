# ADR-001: Feature Flags pour Gradual Rollout

**Date**: 2024-01-XX  
**Statut**: Accepté  
**Décideurs**: Équipe technique

## Contexte

Besoin de déployer des features progressivement sans risquer d'impact sur tous les utilisateurs.

## Décision

Implémenter un système de feature flags avec:
- Activation/désactivation par feature
- Rollout par pourcentage (0-100%)
- Whitelist/blacklist d'utilisateurs
- Hash stable pour pourcentage cohérent

## Conséquences

### Positives
- Déploiement sans risque
- Rollback instantané
- Test A/B facile
- Configuration flexible

### Négatives
- Code conditionnel supplémentaire
- Complexité de gestion des flags

## Alternatives considérées

1. **LaunchDarkly**: Coûteux, externalité
2. **Unleash**: Open source mais setup complexe
3. **Custom**: Simple, contrôle total

## Implémentation

- `app/src/core/features/featureFlags.ts`
- Flags stockés localStorage
- API simple: `featureFlags.isEnabled(key, userId)`
