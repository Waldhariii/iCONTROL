# Data Governance

## Scope
Classification, retention, export controls, and minimal DLP enforced by manifest.

## SSOT
- `platform/ssot/data/catalog/*`
- `platform/ssot/data/policies/*`

## Manifest
Compiled into:
- `data_catalog`
- `retention_policies`
- `export_controls`

## Runtime
- Writes index records to `platform/runtime/datagov/records_index`.
- Exports apply masking for `pii.high` by default.
- Retention runner purges/anonymizes per policy and logs audit entries.

## Gates
- Data Catalog Gate
- Retention Policy Gate
- Export Control Gate
