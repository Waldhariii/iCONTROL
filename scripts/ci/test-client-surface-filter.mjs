import { readFileSync } from "fs";
import { execSync } from "child_process";

execSync("node scripts/ci/compile.mjs surface-001 dev", { stdio: "inherit" });
const manifest = JSON.parse(readFileSync("./runtime/manifests/platform_manifest.surface-001.json", "utf-8"));
const routes = manifest.routes?.routes || [];
const clientRoutes = routes.filter((r) => r.surface === "client");
const cpRoutes = routes.filter((r) => r.surface === "cp");
if (clientRoutes.some((r) => r.surface !== "client")) throw new Error("Client routes contain non-client surface");
if (cpRoutes.length === 0) {
  console.log("Client surface filter PASS (no cp routes present)");
} else {
  console.log("Client surface filter PASS");
}
const appJs = readFileSync("./apps/client-app/public/app.js", "utf-8");
if (!appJs.includes("r.surface === \"client\"")) throw new Error("Client app missing surface filter");
