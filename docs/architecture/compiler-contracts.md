# Compiler Contracts

Each compiler consumes SSOT and produces deterministic artifacts in `runtime/manifests`.
All inputs and outputs are validated by JSON Schema (AJV) and must pass `schema-gate`.
Signed platform manifest is the only runtime input.
