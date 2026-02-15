# S2S API Smoke Playbook

Prereq: backend API running on `http://localhost:7070` and S2S HMAC secret exported.

Pack smoke:
```bash
export S2S_CI_HMAC=dummy
node scripts/maintenance/smoke-pack-api.mjs --pack runtime/reports/packs/<PACK_DIR>
```

Marketplace smoke:
```bash
export S2S_CI_HMAC=dummy
TEMPLATE_ID=tmpl:marketplace-free node scripts/maintenance/smoke-marketplace-api.mjs
```

Reports:
- `runtime/reports/SMOKE_PACK_API_*.md`
- `runtime/reports/SMOKE_MARKETPLACE_API_*.md`
