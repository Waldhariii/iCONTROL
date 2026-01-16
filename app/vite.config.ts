import { defineConfig } from "vite";

/* ICONTROL_VITE_RUNTIME_CONFIG_DEV_V1 */
function icontrolRuntimeConfigDevPlugin() {
  return {
    name: "icontrol-runtime-config-dev",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        try {
          const method = (req.method || "GET").toUpperCase();
          if (method !== "GET") return next();

          // Strict path match; reject any querystring (no hidden inputs).
          const u = new URL(req.url || "/", "http://dev.local");
          const path = u.pathname;
          if (u.search && u.search.length > 0) {
            res.statusCode = 400;
            res.setHeader("Content-Type", "application/json");
            res.setHeader("Cache-Control", "no-store");
            res.end(
              JSON.stringify({
                code: "ERR_BAD_QUERY",
                message: "Query params not allowed",
              }),
            );
            return;
          }

          const isCp = path === "/cp/api/runtime-config";
          const isApp = path === "/app/api/runtime-config";
          if (!isCp && !isApp) return next();
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

export default defineConfig({
  plugins: [icontrolRuntimeConfigDevPlugin()],
  server: { port: 5176, strictPort: false },
  preview: { port: 5177, strictPort: false },
  test: {
    include: [
      "src/**/*.{test,spec}.ts",
      "../modules/core-system/ui/frontend-ts/pages/**/*.test.ts",
    ],
    // ICONTROL_VITEST_SETUPFILES_V1: stable storage stubs for tests
    setupFiles: ["./vitest.setup.ts"],
  },
});
