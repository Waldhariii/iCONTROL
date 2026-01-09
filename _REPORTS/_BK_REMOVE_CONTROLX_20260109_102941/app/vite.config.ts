import { defineConfig } from "vite";

export default defineConfig({
  server: { port: 5176, strictPort: false },
  preview: { port: 5177, strictPort: false }
});
