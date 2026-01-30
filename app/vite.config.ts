import { defineConfig, loadEnv } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Default ON in dev server to avoid runtime-config fetch loops.
const enableRuntimeConfigDevMw = process.env.VITE_DEV_RUNTIME_CONFIG_MW !== "0";
// Avoid auto-opening the browser unless explicitly requested.
const enableAutoOpen = process.env.VITE_OPEN === "1";

const VALID_APP_KINDS = new Set(["APP", "CONTROL_PLANE"]);
const __env = loadEnv(process.env.NODE_ENV || "development", process.cwd(), "");
const rawAppKind = __env.VITE_APP_KIND || process.env.VITE_APP_KIND;
if (!rawAppKind || !VALID_APP_KINDS.has(rawAppKind)) {
  throw new Error(
    `VITE_APP_KIND invalide ou absent: \"${rawAppKind}\" (attendu: APP | CONTROL_PLANE).`,
  );
}

/* ICONTROL_VITE_RUNTIME_CONFIG_DEV_V1 */
function icontrolRuntimeConfigDevPlugin() {
  return {
    name: "icontrol-runtime-config-dev",
    configureServer(server) {
      if (!enableRuntimeConfigDevMw) return;
      server.middlewares.use((req, res, next) => {
        try {
          const method = (req.method || "GET").toUpperCase();
          if (method !== "GET") return next();

          // Strict path match for runtime-config endpoints only.
          const u = new URL(req.url || "/", "http://dev.local");
          const path = u.pathname;
          const isCp = path === "/cp/api/runtime-config";
          const isApp = path === "/app/api/runtime-config";
          if (!isCp && !isApp) return next();

          // Allow cache-busting query params in dev (e.g., ?bust=...).
          // We only care about the pathname for this shim.
        } catch {
          return next();
        }

        try {
          const host = (req.headers.host || "127.0.0.1").toString();
          const proto = (req.headers["x-forwarded-proto"] || "http").toString();
          const origin = `${proto}://${host}`;

          // DEV defaults; tenant is still client-selected later (IndexedDB/claims).
          const payload = {
            tenant_id: "local-dev",
            app_base_path: "/app",
            cp_base_path: "/cp",
            api_base_url: new URL("/api", origin).toString(),
            assets_base_url: new URL("/assets", origin).toString(),
            version: 1,
          };

          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          res.setHeader("X-ICONTROL-DEV-ONLY", "1");
          res.end(JSON.stringify(payload));
        } catch (e) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.setHeader("Cache-Control", "no-store");
          res.end(
            JSON.stringify({
              code: "ERR_RUNTIME_CONFIG_DEV",
              error: String(e),
            }),
          );
        }
      });
    },
  };
}

// Cache Vite séparé pour dev:app et dev:cp lorsqu’ils tournent en parallèle (évite ENOTEMPTY sur deps)
const isCp = rawAppKind === "CONTROL_PLANE";
const cacheDir = `node_modules/.vite-${isCp ? "cp" : "app"}`;

export default defineConfig({
  cacheDir,
  plugins: enableRuntimeConfigDevMw ? [icontrolRuntimeConfigDevPlugin()] : [],
  
    outDir: isCp ? "dist/cp" : "dist/app",
  },
  resolve: {
    alias: { "@config": path.resolve(__dirname, "../config") },
  },
  server: {
    port: 5176,
    strictPort: false,
    // Ouvre le navigateur au lancement: /cp/ pour dev:cp, /app/ pour dev:app
    open: enableAutoOpen ? (isCp ? "/cp/" : "/app/") : false,
  },
  preview: { port: 5177, strictPort: false },
  test: {
    include: [
      "src/**/*.{test,spec}.ts",
      "../modules/core-system/ui/frontend-ts/pages/**/*.test.ts",
    ],
    // ICONTROL_VITEST_SETUPFILES_V1: stable storage stubs for tests
    setupFiles: ["./vitest.setup.ts",
      "src/vitest.setup.ts"
    ],
  },
});


