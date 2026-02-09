import express from 'express';
import { entitlementsEntry } from "./api/entitlements.entry";
import { tenantBoundary } from "./api/tenantBoundary";
import { openDb } from "./db/db";
import cors from 'cors';
import { getMyEntitlements } from './api/entitlements.js';

const app = express();

const db = openDb(process.env.ICONTROL_DB_FILE || (new URL('../data/icontrol.db', undefined)).pathname);
const PORT = Number(process.env.PORT ?? 8787);

app.use(cors());
app.use(express.json());

app.get('/healthz', (_req, res) => res.json({ ok: true }));
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.get('/api/entitlements/me', getMyEntitlements);
app.use("/api/entitlements", tenantBoundary(db), entitlementsEntry(db));

app.listen(PORT, () => {
  console.log(`🚀 iCONTROL API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health: http://localhost:${PORT}/health`);
  console.log(`👥 Tenants: http://localhost:${PORT}/api/tenants`);
});
