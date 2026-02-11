# RFC-20260203-002-phase6-move6-arch-freeze-harden-tool-roots

Statut: APPROVED
Date: 2026-02-03

## Contexte
La gate `architecture-freeze` signalait des faux positifs sur des artefacts d'outils/OS (Claude/Cursor/IDE), ce qui degradait le ratio signal/bruit.

## Decision
- Ajouter un `IGNORE_ROOTS` canonique dans `gate-architecture-freeze.sh` pour ignorer uniquement les artefacts techniques connus.
- Conserver le blocage strict sur tout nouveau root metier non allowliste.
- Ajouter un test contract pour verrouiller:
  - PASS pour un root outil.
  - FAIL pour un root metier inconnu.

## Impact
- Gouvernance arch-freeze plus stable et durable.
- Zero dilution du signal sur les vrais nouveaux roots d'architecture.

## Rollback
Revert du commit Move6 puis realignement release-train.
