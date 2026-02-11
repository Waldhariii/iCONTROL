# UI Component Registry (SSOT) — Control Plane/Admin

## Objectif
Standardiser l’UI Admin (CP) pour empêcher le drift visuel, réduire les styles inline, et garantir la traçabilité (SSOT).

## Source of Truth
- Machine-readable: `app/src/core/ui/registry.ts`
- Canonical CSS (CP scoped): `app/src/styles/STYLE_ADMIN_FINAL.css`

## Contrat minimal par composant
Chaque composant doit:
1) Appliquer sa `classBase` canonique
2) Utiliser des tokens SSOT (via CSS variables) au lieu d’inline styles
3) Limiter l’inline à la whitelist documentée (ex: hauteur dynamique)

## Gouvernance
- PHASE 6.1: Registry + Gate en mode **report-only**
- PHASE 6.2: Contracts + enforcement progressif
- PHASE 6.3: Baseline visuelle (snapshots ciblés)
- PHASE 6.4: “No Rogue UI” (bloquant)

## Comment ajouter un composant
1) Ajouter une entrée dans `registry.ts` (id + classBase + sources)
2) S’assurer que la classe existe dans `STYLE_ADMIN_FINAL.css` sous `[data-app-kind="control_plane"]`
3) Exécuter `npm -s run -S gate:ui-component-registry`
