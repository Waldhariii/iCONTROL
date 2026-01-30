# rg -n safety backlog (Phase 2.3A — parser fix)

## Résumé exécutif
- Total entrées détectées: **13**
- Fichiers impactés: **7**
- Formats détectés: bullet_path_label
- Répartition: line-format=0 ; label-format=13

## Top priorités (risk + volume)
1. **scripts/audit/audit-no-leaks.zsh** — hits=4 (line=0, label=4) — risk=MED
   - labels: HIT_A1=1, HIT_B1=1, HIT_C1=1, HIT_D1=1
   - `scripts/audit/audit-no-leaks.zsh:HIT_A1="$(rg -n --hidden --no-ignore "${EXCL[@]}" "[USER_HOME]/" "\$ROOT" || true)"`
   - `scripts/audit/audit-no-leaks.zsh:HIT_B1="$(rg -n --hidden --no-ignore "${EXCL[@]}" "$LEGACY_TOKEN" "$ROOT" || true)"`
   - `scripts/audit/audit-no-leaks.zsh:HIT_C1="$(rg -n --hidden --no-ignore "${EXCL[@]}" "from\\s+['\"]/modules/|from\\s+['\"]\\.\\./\\.\\./modules/" "$ROOT/core-kernel" || true)"`
   - `scripts/audit/audit-no-leaks.zsh:HIT_D1="$(rg -n --hidden --no-ignore "${EXCL[@]}" "modules/[^/]+/.*modules/[^/]+" "$ROOT/modules" || true)"`
2. **scripts/maintenance/purge-legacy-brand-token.zsh** — hits=2 (line=0, label=2) — risk=MED
   - labels: HITS=1, HITS2=1
   - `scripts/maintenance/purge-legacy-brand-token.zsh:HITS="$(rg -n --hidden --no-ignore "${EXCL[@]}" "$LEGACY_TOKEN" "$ROOT" || true)"`
   - `scripts/maintenance/purge-legacy-brand-token.zsh:HITS2="$(rg -n --hidden --no-ignore "${EXCL[@]}" "$LEGACY_TOKEN" "$ROOT" || true)"`
3. **scripts/maintenance/purge-legacy-brand.zsh** — hits=2 (line=0, label=2) — risk=MED
   - labels: HITS=1, HITS2=1
   - `scripts/maintenance/purge-legacy-brand.zsh:HITS="$(rg -n --hidden --no-ignore "${EXCL[@]}" "iCONTROL" "$ROOT" || true)"`
   - `scripts/maintenance/purge-legacy-brand.zsh:HITS2="$(rg -n --hidden --no-ignore "${EXCL[@]}" "iCONTROL" "$ROOT" || true)"`
4. **scripts/gates/gate-oss.zsh** — hits=2 (line=0, label=2) — risk=MED
   - labels: BAD_TRACKED=1, BAD_STAGED=1
   - `scripts/gates/gate-oss.zsh:BAD_TRACKED="$(git ls-files -z | tr '\0' '\n' | rg -n --pcre2 '(^|/)\.DS_Store$|^app/dist/|^dist/|^node_modules/|^\.vite/|^\.cache/' || true)"`
   - `scripts/gates/gate-oss.zsh:BAD_STAGED="$(git diff --cached --name-status | rg -v '^D\t' | rg -n --pcre2 '(^|/)\.DS_Store$|^app/dist/|^dist/|^node_modules/|^\.vite/|^\.cache/' || true)"`
5. **scripts/audit/audit-ui-cssvars-backlog-shared.zsh** — hits=1 (line=0, label=1) — risk=MED
   - labels: MATCHES=1
   - `scripts/audit/audit-ui-cssvars-backlog-shared.zsh:MATCHES=$(rg -n "\\$\\{TOK\\.(text|mutedText|border|card|panel|accent|accent2)\\}" "$SCOPE" -S || true)`
6. **scripts/audit/audit-ui-cssvars-rollout.zsh** — hits=1 (line=0, label=1) — risk=MED
   - labels: MATCHES=1
   - `scripts/audit/audit-ui-cssvars-rollout.zsh:MATCHES=$(rg -n "\\$\\{TOK\\.(text|mutedText|border|card|panel|accent|accent2)\\}" "$SCOPE" -S | rg -v "/_shared/" || true)`
7. **scripts/audit/audit-ui-no-hardcoded-colors.zsh** — hits=1 (line=0, label=1) — risk=MED
   - labels: HITS=1
   - `scripts/audit/audit-ui-no-hardcoded-colors.zsh:HITS="$(rg -n -S --pcre2 "$PATTERN" "$ROOT" "${EXCLUDES[@]}" || true)"`

## Backlog complet

| Priorité | Risk | Hits | Line | Label | Fichier | Labels (top) |
|---:|---|---:|---:|---:|---|---|
| 1 | MED | 4 | 0 | 4 | `scripts/audit/audit-no-leaks.zsh` | HIT_A1=1, HIT_B1=1, HIT_C1=1, HIT_D1=1 |
| 2 | MED | 2 | 0 | 2 | `scripts/maintenance/purge-legacy-brand-token.zsh` | HITS=1, HITS2=1 |
| 3 | MED | 2 | 0 | 2 | `scripts/maintenance/purge-legacy-brand.zsh` | HITS=1, HITS2=1 |
| 4 | MED | 2 | 0 | 2 | `scripts/gates/gate-oss.zsh` | BAD_TRACKED=1, BAD_STAGED=1 |
| 5 | MED | 1 | 0 | 1 | `scripts/audit/audit-ui-cssvars-backlog-shared.zsh` | MATCHES=1 |
| 6 | MED | 1 | 0 | 1 | `scripts/audit/audit-ui-cssvars-rollout.zsh` | MATCHES=1 |
| 7 | MED | 1 | 0 | 1 | `scripts/audit/audit-ui-no-hardcoded-colors.zsh` | HITS=1 |
