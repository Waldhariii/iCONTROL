/**
 * PLACEHOLDER GOVERNANCE
 * @placeholder
 * code: WARN_PLACEHOLDER_NOT_IMPLEMENTED
 * owner: core-platform
 * expiry: TBD
 * risk: LOW
 * file: docs/contracts/runtime.md
 *
 * Rationale:
 * - Stub de compilation pour unblock bundling/tests.
 * - À remplacer par une implémentation réelle avant prod.
 */

# Runtime Contract (iCONTROL) — ICONTROL_RUNTIME_CONTRACT_V1

## Pipeline canonique (non négociable)
Blueprint → compilePlan → RenderPlan → executePlan → safeRender → HTML

## RenderOp (contractuel, figé)
- `text`: `{ op:"text", value: string }`
- `component`: `{ op:"component", id: string, props?: Record<string, unknown> }`

Aucune autre opération n’est autorisée sans bump de version + tests de régression.

## RenderPlan
- `ops: RenderOp[]` (non vide si blueprint valide)
- `requires?: Permission[]` (RBAC): si présent, l’exécution DOIT faire respecter les permissions.

## Sécurité (SafeRender)
Strict, jamais permissif.
Bloque (dans les balises HTML seulement pour on*):
- `<script`
- inline handlers `on*=` dans une balise (`/<[^>]*\bon\w+\s*=/i`)
- `javascript:`
- `data:text/html`

Toute évolution exige tests positifs + négatifs.

## SAFE_MODE / RBAC
- SAFE_MODE: interdit tout rendu non explicitement autorisé (policy).
- RBAC: `requires` doit être validé avant toute exécution.

## Builtins
HTML déterministe, SafeRender-compliant:
- aucun `on*=` inline
- aucune URL dangereuse
- output stable (audit-friendly)

## Stratégie de blocage (à figer)
Choisir et appliquer uniformément:
- STRICT: `err("forbidden", ...)` (hard fail)
- COMPAT: placeholder + WARN code stable (soft fail)


### Invariants (governance)

- **Required fields** must always be present: `version`, `safeMode`, `features`, `endpoints`.
- **Defaults** apply when fields are absent (consumer-side): no side effects.
- **Versioning**: backward compatible; additive only.
- **SAFE_MODE**:
  - When `safeMode=true`, consumers must not execute side effects.
  - Absence of config MUST result in SAFE_MODE behavior.
- **Paid extensions**:
  - Never required for correctness.
  - Must be disable-able instantly (kill-switch).

