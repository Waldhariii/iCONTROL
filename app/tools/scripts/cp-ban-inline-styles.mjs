import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const ROOT = process.argv[2];
if (!ROOT) {
  console.error("Usage: node cp-ban-inline-styles.mjs <cp_dir> <css_out>");
  process.exit(1);
}
const CSS_OUT = process.argv[3];
if (!CSS_OUT) process.exit(1);

function walk(dir, out=[]) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === "_backups") continue;
      walk(p, out);
    } else if (ent.isFile() && p.endsWith(".ts")) out.push(p);
  }
  return out;
}

function sha(s) {
  return crypto.createHash("sha1").update(s).digest("hex").slice(0, 10);
}

function normDecls(css) {
  // cssText: declarations only. Normalize whitespace.
  return css
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length)
    .join(" ");
}

function cssBlock(className, decls) {
  return `\n/* CP_INLINE_EXTRACT:${className} */\n.${className} { ${decls} }\n`;
}

let cssOut = fs.readFileSync(CSS_OUT, "utf8");
const existing = new Set(
  [...cssOut.matchAll(/\/\*\s*CP_INLINE_EXTRACT:([a-z0-9_-]+)\s*\*\//gi)].map(m => m[1])
);

const files = walk(ROOT);
const report = {
  changed_files: [],
  added_css: [],
  skipped_dynamic: [], // has ${...}
  hits: 0,
};

for (const file of files) {
  const orig = fs.readFileSync(file, "utf8");
  let text = orig;
  let changed = false;

  // 1) el.style.cssText = `...`;  (no ${})
  text = text.replace(
    /([A-Za-z_$][\w$]*)\.style\.cssText\s*=\s*`([^`]*?)`;\s*/g,
    (m, el, css) => {
      report.hits++;
      if (css.includes("${")) {
        report.skipped_dynamic.push({ file, kind: "cssText(template)", sample: css.slice(0, 120) });
        return m;
      }
      const decls = normDecls(css);
      const className = `ic-cp-${sha(decls)}`;
      if (!existing.has(className)) {
        cssOut += cssBlock(className, decls);
        existing.add(className);
        report.added_css.push({ className, file });
      }
      changed = true;
      return `${el}.classList.add("${className}");\n`;
    }
  );

  // 2) el.setAttribute("style", `...`);
  text = text.replace(
    /([A-Za-z_$][\w$]*)\.setAttribute\(\s*["']style["']\s*,\s*`([^`]*?)`\s*\)\s*;\s*/g,
    (m, el, css) => {
      report.hits++;
      if (css.includes("${")) {
        report.skipped_dynamic.push({ file, kind: "setAttribute(template)", sample: css.slice(0, 120) });
        return m;
      }
      const decls = normDecls(css);
      const className = `ic-cp-${sha(decls)}`;
      if (!existing.has(className)) {
        cssOut += cssBlock(className, decls);
        existing.add(className);
        report.added_css.push({ className, file });
      }
      changed = true;
      return `${el}.classList.add("${className}");\n`;
    }
  );

  // 3) inline HTML style="...": replace with class="ic-cp-<hash>"
  // Only for double-quoted style attr; safe for your generated HTML strings.
  text = text.replace(
    /style="([^"]+?)"/g,
    (m, css) => {
      report.hits++;
      if (css.includes("${")) {
        // dynamic inline in template strings — leave
        return m;
      }
      const decls = normDecls(css.replace(/;+\s*$/,";"));
      const className = `ic-cp-${sha(decls)}`;
      if (!existing.has(className)) {
        cssOut += cssBlock(className, decls);
        existing.add(className);
        report.added_css.push({ className, file });
      }
      changed = true;
      return `class="${className}"`;
    }
  );

  if (changed && text !== orig) {
    fs.writeFileSync(file, text, "utf8");
    report.changed_files.push(file);
  }
}

fs.writeFileSync(CSS_OUT, cssOut, "utf8");
console.log("OK: codemod done");
console.log(JSON.stringify(report, null, 2));
