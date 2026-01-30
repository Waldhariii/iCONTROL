import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const icontrolRoot = path.resolve(__dirname, "..");

const hostApp = process.env.ICONTROL_APP_HOST || "127.0.0.1";
const hostCp = process.env.ICONTROL_CP_HOST || "127.0.0.1";
const portApp = process.env.ICONTROL_APP_PORT || "5176";
const portCp = process.env.ICONTROL_CP_PORT || "5177";

process.stdout.write("UI Catalog DEV servers starting...\n");
process.stdout.write(`APP: http://${hostApp}:${portApp}/app/#/__ui-catalog\n`);
process.stdout.write(`CP : http://${hostCp}:${portCp}/cp/#/__ui-catalog\n`);

const child = spawn("npm", ["run", "dev:both"], {
  cwd: icontrolRoot,
  stdio: "inherit",
});

child.on("close", (code) => {
  process.exit(code ?? 0);
});
