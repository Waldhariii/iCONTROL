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
  loadManifest({ releaseId, stalenessMs: 0 });
  console.log("SLO synthetic check PASS");
  process.exit(0);
} catch (err) {
  console.error(`SLO synthetic check FAIL: ${err.message}`);
  process.exit(2);
}
