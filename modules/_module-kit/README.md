# Domain Module Kit

This kit defines a standard, declarative module contract for SSOT.

## Files
- `module.template.json`: example module definition fragment
- `validate-module.mjs`: validates a module JSON file using core contracts

## Rules
- No code, only declarative definitions.
- No module -> module imports. Only platform:* dependencies allowed.
- All provided resources must exist in SSOT.
