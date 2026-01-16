import { build, context } from "esbuild";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const entry = path.join(__dirname, "runtime-config-server.ts");
const outdir = path.join(__dirname, "dist");
const outfile = path.join(outdir, "runtime-config-server.mjs");

const args = new Set(process.argv.slice(2));
const watch = args.has("--watch");
const run = args.has("--run");

let child = null;

function startServer() {
  if (child) child.kill();
  child = spawn("node", [outfile, "--dev"], {
    stdio: "inherit",
  });
}

async function buildOnce() {
  await build({
    entryPoints: [entry],
    outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    sourcemap: true,
  });
  if (run) startServer();
}

async function buildWatch() {
  const ctx = await context({
    entryPoints: [entry],
    outfile,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    sourcemap: true,
  });
  await ctx.watch();
  if (run) startServer();
}

if (watch) {
  await buildWatch();
} else {
  await buildOnce();
}
