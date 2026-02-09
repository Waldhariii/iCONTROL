import express from 'express';
import cors from 'cors';
import path from 'path';
import { openDb } from './db/db';

const app = express();
app.use(cors());
app.use(express.json());

// Chemin absolu vers la DB
const dbPath = path.join(__dirname, '..', 'icontrol.db');
const db = openDb(process.env.ICONTROL_DB_FILE || dbPath);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', db: 'connected' });
});

app.get('/api/pages/:id', (req, res) => {
  const { id } = req.params;
  const tenantId = req.headers['x-tenant-id'] as string || 'default';
  
  try {
    // TODO: Query real page from DB
    res.json({
      id,
      tenantId,
      name: `Page ${id}`,
      content: { widgets: [] }
    });
  } catch (err) {
    res.status(500).json({ error: String(err) });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
