import { spawnSync } from "node:child_process";
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const icontrolRoot = path.resolve(__dirname, "..");
const workspaceRoot = path.resolve(icontrolRoot, "..");

const ARCHIVE_DIR = path.join(workspaceRoot, "_ARCHIVES", "ui-catalog");
const OUTPUT_PATH = path.join(ARCHIVE_DIR, "INVENTORY_UI.md");
const ROUTES_APP = path.join(workspaceRoot, "_ARCHIVES", "ui-preview", "routes_app.txt");
const ROUTES_CP = path.join(workspaceRoot, "_ARCHIVES", "ui-preview", "routes_cp.txt");

function rgLines(args, cwd = icontrolRoot) {
  const res = spawnSync("rg", args, { cwd, encoding: "utf8" });
  if (res.status !== 0 && res.status !== 1) {
    throw new Error(`rg failed: ${res.stderr || res.stdout}`);
  }
  return (res.stdout || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function listFiles(paths, globs) {
  const existing = paths.filter((p) => fs.existsSync(path.join(icontrolRoot, p)));
  if (existing.length === 0) return [];
  const args = ["--files"];
  globs.forEach((glob) => args.push("-g", glob));
  return rgLines([...args, ...existing]);
}

function readRoutes(filePath) {
  if (!fs.existsSync(filePath)) return [];
  const raw = fs.readFileSync(filePath, "utf8");
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#"));
}

function extractExports(filePath) {
  const content = fs.readFileSync(path.join(icontrolRoot, filePath), "utf8");
  const names = new Set();
  const exportRe = /export\s+(?:function|class|const|let|var|interface|type)\s+([A-Za-z0-9_]+)/g;
  const defaultRe = /export\s+default\s+([A-Za-z0-9_]+)?/g;
  let match;
  while ((match = exportRe.exec(content))) {
    if (match[1]) names.add(match[1]);
  }
  while ((match = defaultRe.exec(content))) {
    names.add(match[1] || "default");
  }
  return [...names];
}

function describeItem(name, filePath) {
  const lower = `${name} ${filePath}`.toLowerCase();
  if (lower.includes("chart") || lower.includes("spark") || lower.includes("donut")) return "Chart/graph UI";
  if (lower.includes("table")) return "Table/grid UI";
  if (lower.includes("shell") || lower.includes("layout")) return "Layout/shell";
  if (lower.includes("page")) return "Page renderer";
  if (lower.includes("toast")) return "Toast/notification";
  if (lower.includes("modal")) return "Modal/dialog";
  if (lower.includes("toolbar") || lower.includes("nav") || lower.includes("sidebar")) return "Navigation/toolbar";
  if (lower.includes("error") || lower.includes("empty") || lower.includes("access")) return "State/feedback UI";
  if (lower.includes("badge")) return "Badge/label UI";
  return "UI component";
}

function countUsage(name, excludeFile) {
  if (!name || name === "default" || name.length < 3) return 2;
  const pattern = `\\b${name}\\b`;
  const args = [
    "-g",
    "*.{ts,tsx,js,jsx}",
    "-n",
    pattern,
    "app/src",
    "modules",
    "components",
  ];
  const res = spawnSync("rg", args, { cwd: icontrolRoot, encoding: "utf8" });
  if (res.status !== 0 && res.status !== 1) return 2;
  const lines = (res.stdout || "")
    .split("\n")
    .filter((line) => line.trim() && !line.includes(`${excludeFile}:`));
  return lines.length + 1;
}

async function main() {
  await fsp.mkdir(ARCHIVE_DIR, { recursive: true });

  const routesApp = readRoutes(ROUTES_APP);
  const routesCp = readRoutes(ROUTES_CP);

  const pagesApp = listFiles(["app/src/pages/app"], ["*.{ts,tsx,js,jsx}"]);
  const pagesCp = listFiles(["app/src/pages/cp"], ["*.{ts,tsx,js,jsx}"]);
  const pagesModules = listFiles(
    ["modules"],
    ["**/pages/**/*.{ts,tsx,js,jsx}", "**/ui/**/pages/**/*.{ts,tsx,js,jsx}"]
  );

  const componentFiles = [
    ...listFiles(["app/src/core/ui"], ["*.{ts,tsx,js,jsx}"]),
    ...listFiles(["modules"], ["**/ui/**/*.{ts,tsx,js,jsx}"]),
    ...listFiles(["components"], ["**/*.{ts,tsx,js,jsx}"]),
  ];

  const exports = [];
  for (const file of componentFiles) {
    const names = extractExports(file);
    names.forEach((name) => {
      const usageCount = countUsage(name, file);
      const orphan = usageCount <= 1;
      exports.push({
        name,
        file,
        orphan,
        desc: describeItem(name, file),
      });
    });
  }

  const stateKeywords = [
    "AccessDenied",
    "SafeMode",
    "Entitlement",
    "ErrorState",
    "EmptyState",
    "Skeleton",
    "Loading",
    "ReadOnly",
    "blocked",
  ];
  const stateHits = rgLines([
    "-g",
    "*.{ts,tsx,js,jsx}",
    "-n",
    stateKeywords.join("|"),
    "app/src",
    "modules",
  ]);
  const stateFiles = [...new Set(stateHits.map((line) => line.split(":")[0]))];

  const chartKeywords = ["chart", "donut", "sparkline", "kpi", "miniBars", "line", "bar", "area"];
  const chartHits = rgLines([
    "-g",
    "*.{ts,tsx,js,jsx}",
    "-n",
    chartKeywords.join("|"),
    "app/src",
    "modules",
  ]);
  const chartFiles = [...new Set(chartHits.map((line) => line.split(":")[0]))];

  const tokenHits = rgLines([
    "-g",
    "*.{ts,tsx,js,jsx}",
    "-n",
    "MAIN_SYSTEM_THEME|themeManager|tokens",
    "app/src",
    "modules",
  ]);
  const tokenFiles = [...new Set(tokenHits.map((line) => line.split(":")[0]))];

  const historicDirs = ["docs", "patches", "_REPORTS", "_ARCHIVES", "proofs", "audits"];
  const historicFiles = historicDirs.flatMap((dir) => {
    const full = path.join(icontrolRoot, dir);
    if (!fs.existsSync(full)) return [];
    return listFiles([dir], ["**/*"]);
  });

  const lines = [];
  lines.push("# UI Inventory");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Root: ${icontrolRoot}`);
  lines.push("");
  lines.push("## A1 Pages & Routes");
  lines.push("");
  lines.push("### Routes /app");
  routesApp.forEach((route) => lines.push(`- ${route}`));
  lines.push("");
  lines.push("### Routes /cp");
  routesCp.forEach((route) => lines.push(`- ${route}`));
  lines.push("");
  lines.push("### Pages (app)");
  pagesApp.forEach((file) => lines.push(`- ${file} - page`));
  lines.push("");
  lines.push("### Pages (cp)");
  pagesCp.forEach((file) => lines.push(`- ${file} - page`));
  lines.push("");
  lines.push("### Pages (modules)");
  pagesModules.forEach((file) => lines.push(`- ${file} - page`));
  lines.push("");
  lines.push("## A2 Reusable Components & Widgets");
  lines.push("");
  exports.forEach((entry) => {
    const suffix = entry.orphan ? "ORPHELIN (candidate: ancien visuel)" : entry.desc;
    lines.push(`- ${entry.file} :: ${entry.name} - ${suffix}`);
  });
  lines.push("");
  lines.push("## A3 Visual States");
  lines.push("");
  stateFiles.forEach((file) => lines.push(`- ${file} - matches state keywords`));
  lines.push("");
  lines.push("## A4 Charts & Tokens");
  lines.push("");
  chartFiles.forEach((file) => lines.push(`- ${file} - chart/graph keyword match`));
  tokenFiles.forEach((file) => lines.push(`- ${file} - theme/token usage`));
  lines.push("");
  lines.push("## A5 Historical Visuals (docs/patches/audits)");
  lines.push("");
  historicFiles.forEach((file) => lines.push(`- ${file}`));
  lines.push("");

  await fsp.writeFile(OUTPUT_PATH, lines.join("\n"), "utf8");
  process.stdout.write(`UI inventory written: ${OUTPUT_PATH}\n`);
}

main().catch((err) => {
  console.error("UI inventory failed:", err);
  process.exit(1);
});
