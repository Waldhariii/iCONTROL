#!/usr/bin/env node
/**
 * Deterministic normalizer for proofs/PROOFS_PLACEHOLDERS.json
 * Goals:
 * - stable "ts" (avoid churn)
 * - stable item ordering (by rel path)
 * - stable key set + key ordering
 * - recompute count
 *
 * NOTE: This does not change runtime behavior; it's a governance/DX artifact cleanup.
 */
const fs = require("node:fs");
const path = require("node:path");

const FILE = path.join("proofs", "PROOFS_PLACEHOLDERS.json");
if (!fs.existsSync(FILE)) {
  console.error("[FAIL] missing", FILE, "(run proofs generator first)");
  process.exit(1);
}

function asRel(item) {
  const r = item.rel || item.file || "";
  if (!r) return "";
  // normalize to "./..."
  if (r.startsWith("./")) return r;
  if (r.startsWith("/")) return "." + r; // unlikely, but keep local-ish
  return "./" + r.replace(/^\.?\//, "");
}

function pickBool(v) {
  return typeof v === "boolean" ? v : undefined;
}

function pickNum(v) {
  return Number.isFinite(v) ? v : undefined;
}

function pickStr(v) {
  return typeof v === "string" ? v : undefined;
}

const raw = JSON.parse(fs.readFileSync(FILE, "utf8"));

const kind = raw.kind || "ICONTROL_PLACEHOLDER_INVENTORY_PROOF_V1";

// Normalize items
const srcItems = Array.isArray(raw.items) ? raw.items : [];
const items = srcItems
  .map((it) => {
    const rel = asRel(it);
    const out = {
      rel,
      sha256: pickStr(it.sha256) || "",
      size_bytes: pickNum(it.size_bytes) ?? 0,
      first_line: pickStr(it.first_line) || "",
      has_export_default: pickBool(it.has_export_default) ?? false,
      has_named_exports: pickBool(it.has_named_exports) ?? false,
      placeholder_hit: pickBool(it.placeholder_hit) ?? false,
    };
    return out;
  })
  .filter((it) => it.rel && it.sha256)
  .sort((a, b) => a.rel.localeCompare(b.rel));

// Stable top-level (key order is insertion order)
const normalized = {
  kind,
  ts: "DETERMINISTIC",           // stable; evidence timestamp lives in gates logs (_pr_pack)
  count: items.length,
  items,
};

fs.writeFileSync(FILE, JSON.stringify(normalized, null, 2) + "\n");
console.log("[OK] normalized:", FILE, "(items:", items.length + ")");
