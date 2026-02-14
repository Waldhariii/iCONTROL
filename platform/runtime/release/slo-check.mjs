import { loadManifest } from "../loader/loader.mjs";

const releaseId = process.argv[2];
if (!releaseId) {
  console.error("Missing releaseId");
  process.exit(1);
}

try {
  loadManifest({ releaseId, stalenessMs: 0 });
  console.log("SLO synthetic check PASS");
  process.exit(0);
} catch (err) {
  console.error(`SLO synthetic check FAIL: ${err.message}`);
  process.exit(2);
}
