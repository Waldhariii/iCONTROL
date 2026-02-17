/**
 * Visual OS: merge base tokens, semantic tokens, tenant overrides, extension themes.
 * Single source color (brand-source.json) -> color-engine scale -> semantic tokens -> theme_vars.css.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { buildBrandPalette } from "../color-engine/color-engine.mjs";

const ROOT = process.cwd();
const TOKENS_DIR = join(ROOT, "design-system", "tokens");
const OUT_DIR = join(ROOT, "runtime", "theme");
const OUT_CSS = join(OUT_DIR, "theme_vars.css");

function loadJson(p) {
  if (!existsSync(p)) return null;
  return JSON.parse(readFileSync(p, "utf-8"));
}

function flatten(obj, prefix = "", out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null && !Array.isArray(v)) {
      flatten(v, key, out);
    } else {
      out[key] = v;
    }
  }
  return out;
}

function resolveSemantic(semantic, primitives) {
  const out = {};
  for (const [key, val] of Object.entries(semantic)) {
    const str = String(val);
    const m = str.match(/^\{(.+)\}$/);
    out[key] = m && primitives[m[1]] != null ? primitives[m[1]] : str;
  }
  return out;
}

// 1) Load base primitives from token files
const primitives = {};
for (const name of ["color", "spacing", "radius", "typography", "shadow", "motion"].map((n) => n + ".tokens.json")) {
  const p = join(TOKENS_DIR, name);
  const j = loadJson(p);
  if (j) Object.assign(primitives, flatten(j));
}

// 2) Effective brand source: brand-source.json + tenant overrides (brand_primary / brand_secondary)
let effectiveBrandSource = loadJson(join(OUT_DIR, "brand-source.json")) || {};
const extDir = join(ROOT, "extensions");
if (existsSync(extDir)) {
  for (const sub of readdirSync(extDir)) {
    const themePath = join(extDir, sub, "theme", "tenant-theme.json");
    if (existsSync(themePath)) {
      const j = loadJson(themePath);
      if (j && typeof j === "object" && (j.brand_primary != null || j.brand_secondary != null)) {
        if (j.brand_primary != null) effectiveBrandSource = { ...effectiveBrandSource, brand_primary: j.brand_primary };
        if (j.brand_secondary != null) effectiveBrandSource = { ...effectiveBrandSource, brand_secondary: j.brand_secondary };
      }
    }
    const officialPath = join(extDir, sub, "official");
    if (existsSync(officialPath)) {
      for (const extName of readdirSync(officialPath)) {
        const p = join(officialPath, extName, "theme", "tenant-theme.json");
        if (existsSync(p)) {
          const j = loadJson(p);
          if (j && typeof j === "object" && (j.brand_primary != null || j.brand_secondary != null)) {
            if (j.brand_primary != null) effectiveBrandSource = { ...effectiveBrandSource, brand_primary: j.brand_primary };
            if (j.brand_secondary != null) effectiveBrandSource = { ...effectiveBrandSource, brand_secondary: j.brand_secondary };
          }
        }
      }
    }
  }
}

// 3) Generate brand scale (50..950 + primary) and inject into color namespace
const brandPalette = buildBrandPalette(effectiveBrandSource);
if (brandPalette.brand && Object.keys(brandPalette.brand).length) {
  for (const [k, v] of Object.entries(brandPalette.brand)) {
    primitives["color.brand." + k] = v;
  }
}

// 4) Re-resolve semantic tokens (UI uses only semantic refs; never raw brand scale)
const semanticRaw = loadJson(join(TOKENS_DIR, "semantic.tokens.json")) || {};
const semantic = resolveSemantic(semanticRaw, primitives);

const lines = [];
for (const [key, val] of Object.entries(primitives)) {
  if (typeof val === "string" || typeof val === "number") lines.push(`  --${key.replace(/\./g, "-")}: ${val};`);
}
for (const [key, val] of Object.entries(semantic)) {
  lines.push(`  --${key.replace(/\./g, "-")}: ${val};`);
}
const densityDir = join(ROOT, "design-system", "density");
if (existsSync(densityDir)) {
  for (const name of readdirSync(densityDir).filter((n) => n.endsWith(".json"))) {
    const j = loadJson(join(densityDir, name));
    if (j && typeof j === "object") {
      const flat = flatten(j);
      for (const [key, val] of Object.entries(flat)) lines.push(`  --density-${key.replace(/\./g, "-")}: ${val};`);
    }
  }
}
if (existsSync(extDir)) {
  for (const sub of readdirSync(extDir)) {
    const themePath = join(extDir, sub, "theme", "tenant-theme.json");
    if (existsSync(themePath)) {
      const j = loadJson(themePath);
      if (j && typeof j === "object") {
        const flat = flatten(j);
        for (const [key, val] of Object.entries(flat)) lines.push(`  --ext-${key.replace(/\./g, "-")}: ${val};`);
      }
    }
    const officialPath = join(extDir, sub, "official");
    if (existsSync(officialPath)) {
      for (const extName of readdirSync(officialPath)) {
        const p = join(officialPath, extName, "theme", "tenant-theme.json");
        if (existsSync(p)) {
          const j = loadJson(p);
          if (j && typeof j === "object") {
            const flat = flatten(j);
            for (const [key, val] of Object.entries(flat)) lines.push(`  --ext-${key.replace(/\./g, "-")}: ${val};`);
          }
        }
      }
    }
  }
}

const css = "/* Visual OS — token-driven. Do not edit by hand. */\n:root {\n" + lines.join("\n") + "\n}\n";
mkdirSync(OUT_DIR, { recursive: true });
writeFileSync(OUT_CSS, css, "utf-8");
console.log("Wrote", OUT_CSS);
