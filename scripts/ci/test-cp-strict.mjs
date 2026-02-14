import { readFileSync } from "fs";

const js = readFileSync("apps/control-plane/public/app.js", "utf-8");
if (!js.includes("System Locked — Manifest Required")) {
  throw new Error("Strict locked screen missing");
}
if (js.includes("Pages\", hash")) {
  throw new Error("Fallback nav detected");
}
console.log("CP strict mode PASS");
