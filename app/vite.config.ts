import { defineConfig } from "vite";

export default defineConfig({
  server: { port: 5176, strictPort: false },
  preview: { port: 5177, strictPort: false },
  test: {
    include: [
      "src/**/*.{test,spec}.ts",
      "../modules/core-system/ui/frontend-ts/pages/**/*.test.ts"
    ],
    // ICONTROL_VITEST_SETUPFILES_V1: stable storage stubs for tests
    setupFiles: ["./vitest.setup.ts"]
  }
});
