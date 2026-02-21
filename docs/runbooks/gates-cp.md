# gates:cp (Control Plane)

## What it is
Quality gate for Control Plane boundary:
- lint
- typecheck:cp (tsconfig.typecheck.json with module stubs)
- guard:module-stub-drift

## Local usage
pnpm -w run gen:module-stubs
pnpm -w run gates:cp

## CI usage
Run gen:module-stubs then gates:cp (see workflow/script).
