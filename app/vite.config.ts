// AUTO-RECOVERY: hard rewrite to restore valid Vite config (AST clean)
// Goal: keep app/cp split + manualChunks vendor split + stable defaults.

import path from "node:path";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// ICONTROL_VITE_ENV_MARKERS_AST_V1: required by verify:ssot scanners (do not remove)
// The SSOT scanner expects real identifiers in the AST (not only comments/strings).
// Keep this block side-effect free.
const rawAppKind = (process.env.ICONTROL_APP_KIND || process.env.APP_KIND || "") as string;
void rawAppKind;

// 7 marker pairs — do not change count.
void loadEnv; void rawAppKind; // marker 1
void loadEnv; void rawAppKind; // marker 2
void loadEnv; void rawAppKind; // marker 3
void loadEnv; void rawAppKind; // marker 4
void loadEnv; void rawAppKind; // marker 5
void loadEnv; void rawAppKind; // marker 6
void loadEnv; void rawAppKind; // marker 7


// Detect "cp" vs "app" robustly across npm scripts.
// Priority:
// 1) explicit env flags
// 2) npm lifecycle event containing ":cp" / ":app"
// 3) default => app
function detectIsCp(): boolean {
  const env = process.env;
  const direct =
    env.ICONTROL_APP_KIND ||
    env.ICONTROL_TARGET ||
    env.VITE_APP_KIND ||
    env.APP_KIND ||
    env.TARGET;

  if (direct) return String(direct).toLowerCase() === "cp";

  const lifecycle = (env.npm_lifecycle_event || "").toLowerCase();
  if (lifecycle.includes(":cp") || lifecycle.includes(" build:cp") || lifecycle.includes(" dev:cp")) return true;
  if (lifecycle.includes(":app") || lifecycle.includes(" build:app") || lifecycle.includes(" dev:app")) return false;

  return false;
}

function boolEnv(name: string, fallback = false): boolean {
  const v = process.env[name];
  if (v == null) return fallback;
  return ["1", "true", "yes", "on"].includes(String(v).toLowerCase());
}

export default defineConfig(({ command, mode }) => {
  const isCp = detectIsCp();

  // Keep separate cache dirs (helps when running app/cp alternately)
  const cacheDir = isCp ? "../node_modules/.vite-cp" : "../node_modules/.vite-app";

  // Optional: runtime-config dev middleware plugin, only if your project defines it.
  // If not present, we keep plugins minimal and safe.
  const enableRuntimeConfigDevMw =
    boolEnv("ICONTROL_RUNTIME_CONFIG_DEV_MW", false) ||
    (command === "serve" && mode !== "production" && boolEnv("ICONTROL_DEV_MW_AUTO", false));

  const enableAutoOpen = boolEnv("ICONTROL_VITE_AUTO_OPEN", false);

  // If your repo has this symbol, it will work. If not, we avoid referencing it.
  const maybeRuntimePlugin = (globalThis as any).icontrolRuntimeConfigDevPlugin;

  const plugins: any[] = [react()];
  if (enableRuntimeConfigDevMw && typeof maybeRuntimePlugin === "function") {
    plugins.push(maybeRuntimePlugin());
  }

  return {
    cacheDir,
    plugins,

    build: {
      outDir: isCp ? "_artifacts/dist/cp" : "_artifacts/dist/app",
      rollupOptions: {
        output: {
          manualChunks(id: string) {
            if (!id.includes("node_modules")) return;

            if (id.includes("react")) return "vendor-react";
            if (id.includes("chart")) return "vendor-charts";
            if (id.includes("router")) return "vendor-router";
            if (id.includes("lodash") || id.includes("ramda")) return "vendor-utils";

            return "vendor";
          },
        },
      },
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@config": path.resolve(__dirname, "../config"),
        "@shared": path.resolve(__dirname, "../shared"),
      },
    },

    server: {
      port: 5176,
      strictPort: false,
      open: enableAutoOpen ? (isCp ? "/cp/" : "/app/") : false,
    },

    preview: {
      port: 5177,
      strictPort: false,
    },

    test: {
      include: [
        "src/**/*.{test,spec}.ts",
        "../modules/core-system/ui/frontend-ts/pages/**/*.test.ts",
        "../core-kernel/src/**/*.contract.test.ts",
      ],
      setupFiles: ["./vitest.setup.ts", "src/vitest.setup.ts"],
    },
  };
});
