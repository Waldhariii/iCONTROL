# Write Surface Map (report-only)

- Date: 2026-01-25T21:35:20.505Z
- Targets: app/src, modules, platform-services, server
- Excludes: node_modules, dist, coverage
- Pattern: (?:\b(localStorage|sessionStorage)\.setItem\s*\(|     \bfs\.(?:writeFileSync|writeFile|appendFile|appendFileSync)\s*\(|     \b(fetch)\s*\(.*     (?:\{[^}]*\bmethod\s*:\s*"(?:POST|PUT|PATCH|DELETE)")|     \baxios\.(?:post|put|patch|delete)\s*\(|     \b(save|write|persist|upsert|insert|update|delete)[A-Za-z0-9_]*\s*\()
- Total hits: 0

## Top Offenders (by file hit count)

_No matches._

## Raw Matches (first 200)

_No matches._

## Notes
- Report-only: does not block commits.
- Use this list to choose next Write Gateway pilots.
