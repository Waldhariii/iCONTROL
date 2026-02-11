# RFC — Hotfix core: restore vfsGet export (no port widening)

## Contexte
Le runtime CP échoue au chargement (ESM) avec:
> SyntaxError: Indirectly exported binding name 'vfsGet' is not found.

## Décision
Ajouter un export **minimal** `vfsGet(scope, key)` qui délègue à `Vfs.get(scope, key)`.

## Rationale
- Restaure la compat attendue par les modules CP existants.
- Ne change pas le “public surface” au-delà d’un export manquant.
- Pas de logique métier ajoutée; uniquement un pont d’accès déjà existant.

## Impact
- Code: `app/src/core/.../writeGateway.ts` (export ajouté)
- Risk: faible, comportement déterministe.

## Rollback
Revert du commit hotfix sur la branche.

## Validation
- `npm test` PASS
- (Après compliance) `verify:prod:fast` doit redevenir GREEN.
