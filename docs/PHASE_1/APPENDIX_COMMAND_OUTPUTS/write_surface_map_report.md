# Write Surface Map (report-only)

- Date: 2026-01-25T21:23:54.575Z
- Targets: app/src, modules, platform-services, server
- Excludes: node_modules, dist, coverage
- Pattern: localStorage\.setItem\s*\(|sessionStorage\.setItem\s*\(|\bfetch\s*\(.*?\)\s*(?:\n|\r|\r\n)?[^\n]*method\s*:\s*"(POST|PUT|PATCH|DELETE)"|\b(writeFileSync|writeFile|appendFile|appendFileSync)\s*\(
- Total hits: 0

## Top Offenders (by file hit count)

_No matches._

## Raw Matches (first 200)

_No matches._

## Notes
- Report-only: does not block commits.
- Use this list to choose next Write Gateway pilots.
