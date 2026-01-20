import { defineConfig } from "vitest/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, "..");

export default defineConfig({
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "dist/",
        "**/*.test.ts",
        "**/*.spec.ts",
        "vitest.setup.ts",
        "vitest.config.ts"
      ],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80
      }
    },
    include: [
      "src/**/*.{test,spec}.ts",
      "src/**/*.{test,spec}.tsx"
    ],
    exclude: [
      "node_modules/",
      "dist/",
      ".git/"
    ]
  },
  resolve: {
    alias: {
      "/src": path.resolve(__dirname, "./src"),
      "modules": path.resolve(rootDir, "modules")
    }
  }
});
