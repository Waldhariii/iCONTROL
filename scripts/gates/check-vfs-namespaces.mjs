import { execSync } from "node:child_process";

function run(cmd) {
  try { return execSync(cmd, { stdio: ["ignore", "pipe", "ignore"] }).toString("utf8"); }
  catch { return ""; }
}

const hits = run(
  `rg -n --hidden --glob '!**/node_modules/**' --glob '!**/_audit/**' ` +
  `'(namespace\\s*:\\s*["\\\'](\\.\\.|/|~|[A-Za-z]:\\\\)|key\\s*:\\s*["\\\'](\\.\\.|/|~|[A-Za-z]:\\\\))' ` +
  `app/src platform-services modules core-kernel docs || true`
).trim();

if (hits) {
  console.error("ERR_VFS_NAMESPACE_POLICY_VIOLATION: raw path-like namespace/key detected");
  console.error(hits.split("\\n").slice(0, 120).join("\\n"));
  process.exit(1);
}

console.log("OK: gate:vfs-namespaces");
