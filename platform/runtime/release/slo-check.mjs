import { loadManifest } from "../loader/loader.mjs";

const releaseId = process.argv[2];
if (!releaseId) {
  console.error("Missing releaseId");
  process.exit(1);
}

if (process.env.SLO_FORCE_FAIL === "1") {
  console.error("SLO synthetic check FAIL: forced");
  process.exit(2);
}

try {
  const manifestsDir = process.env.MANIFESTS_DIR || process.env.OUT_DIR;
  loadManifest({ releaseId, stalenessMs: 0, manifestsDir });
  console.log("SLO synthetic check PASS");
  process.exit(0);
} catch (err) {
  console.error(`SLO synthetic check FAIL: ${err.message}`);
  process.exit(2);
}
