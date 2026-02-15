import { execSync, spawn } from "child_process";
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { createTempSsot, waitForServer, getS2SToken } from "./test-utils.mjs";

const api = "http://localhost:7070/api";

function readJson(p) {
  return JSON.parse(readFileSync(p, "utf-8"));
}
function writeJson(p, data) {
  writeFileSync(p, JSON.stringify(data, null, 2) + "\n");
}

async function run() {
  const temp = createTempSsot();
  const ssotDir = temp.ssotDir;
  const root = join(ssotDir, "..", "..");
  const manifestsDir = join(root, "runtime", "manifests");
  mkdirSync(manifestsDir, { recursive: true });

  const versionsPath = join(ssotDir, "extensions", "extension_versions.json");
  const versions = readJson(versionsPath);
  versions.push({
    extension_id: "ext:sample",
    version: "1.1.0",
    checksum: "",
    signature: "",
    manifest_fragment_ref: "ext:sample@1.1.0",
    status: "draft",
    hooks: []
  });
  writeJson(versionsPath, versions);

  const reviewsPath = join(ssotDir, "extensions", "extension_reviews.json");
  writeJson(reviewsPath, [
    { id: "review:ext-sample-1.0.0", target: "version", extension_id: "ext:sample", version: "1.0.0", required_approvals: 2, approvals: ["user:admin", "user:admin2"], status: "approved" },
    { id: "review:ext-sample-install-1.0.0", target: "install", extension_id: "ext:sample", version: "1.0.0", required_approvals: 2, approvals: ["user:admin", "user:admin2"], status: "approved" },
    { id: "review:ext-sample-1.1.0", target: "version", extension_id: "ext:sample", version: "1.1.0", required_approvals: 2, approvals: [], status: "pending" },
    { id: "review:ext-sample-install-1.1.0", target: "install", extension_id: "ext:sample", version: "1.1.0", required_approvals: 2, approvals: [], status: "pending" }
  ]);

  execSync("node scripts/ci/compile.mjs dev-001 dev", { stdio: "inherit", env: { ...process.env, SSOT_DIR: ssotDir, OUT_DIR: manifestsDir } });
  const server = spawn("node", ["apps/backend-api/server.mjs"], {
    stdio: "inherit",
    env: { ...process.env, SSOT_DIR: ssotDir, MANIFESTS_DIR: manifestsDir, S2S_CP_HMAC: "dummy", S2S_TOKEN_SIGN: "dummy" }
  });
  await waitForServer(`${api}/runtime/active-release`);

  try {
    const token = await getS2SToken({ baseUrl: "http://localhost:7070", principalId: "svc:cp", secret: "dummy", scopes: ["marketplace.*"] });
    const authHeaders = { authorization: `Bearer ${token}`, "x-tenant-id": "tenant:default" };
    const res = await fetch(`${api}/marketplace/tenants/tenant:default/install`, {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeaders },
      body: JSON.stringify({ type: "extension", id: "ext:sample", version: "latest", reason: "test latest" })
    });
    if (!res.ok) throw new Error(`Expected latest approved install OK, got ${res.status}`);

    const installsPath = join(ssotDir, "extensions", "extension_installations.json");
    const installs = readJson(installsPath);
    const item = installs.find((i) => i.extension_id === "ext:sample" && i.tenant_id === "tenant:default");
    if (!item || item.version !== "1.0.0") throw new Error("Expected resolved version 1.0.0");

    // negative: no approved versions
    writeJson(reviewsPath, []);
    const res2 = await fetch(`${api}/marketplace/tenants/tenant:default/install`, {
      method: "POST",
      headers: { "content-type": "application/json", ...authHeaders },
      body: JSON.stringify({ type: "extension", id: "ext:sample", version: "latest", reason: "test latest missing" })
    });
    if (res2.ok) throw new Error("Expected failure when no approved versions exist");
    const payload = await res2.json();
    if (!String(payload.error || "").includes("No approved versions")) throw new Error("Expected actionable error message");

    console.log("Marketplace latest-approved PASS");
  } finally {
    server.kill();
    temp.cleanup();
  }
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
