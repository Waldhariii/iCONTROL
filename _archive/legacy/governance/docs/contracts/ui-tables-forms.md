# iCONTROL — Contrat Tables & Formulaires (Non-core)

## TableDef (lecture seule)
Usage:
- Tables de lecture uniquement
- Colonnes explicites (id/label)
- Rows normalisées (clé = colonne)

Règles:
- DOM déterministe
- Aucune handler inline
- Export CSV local seulement
- Cap max rows (soft limit)

## FormDef (lecture seule)
Usage:
- Affichage d’état ou paramètres autorisés
- Pas de submission réseau

Règles:
- Champs affichés en lecture (ou édition locale si explicitement contractée)
- Validation locale seulement
- Aucun appel API
