import { mkdtempSync, mkdirSync, rmSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";
import { artifactBudgetGate } from "../../governance/gates/gates.mjs";

const temp = mkdtempSync(join(tmpdir(), "icontrol-artifact-budget-"));
const previewDir = join(temp, "preview");
const snapDir = join(temp, "snapshots");
mkdirSync(previewDir, { recursive: true });
mkdirSync(snapDir, { recursive: true });

function makeDirs(base, count) {
  for (let i = 0; i < count; i++) {
    mkdirSync(join(base, `d-${i}`), { recursive: true });
  }
}

try {
  makeDirs(previewDir, 210);
  makeDirs(snapDir, 210);
  process.env.ARTIFACT_PREVIEW_DIR = previewDir;
  process.env.ARTIFACT_SNAPSHOT_DIR = snapDir;
  let res = artifactBudgetGate();
  if (res.ok) throw new Error("ArtifactBudgetGate should fail when over budget");

  // Reduce below threshold and re-check
  for (let i = 0; i < 20; i++) {
    rmSync(join(previewDir, `d-${i}`), { recursive: true, force: true });
    rmSync(join(snapDir, `d-${i}`), { recursive: true, force: true });
  }
  res = artifactBudgetGate();
  if (res.ok) {
    console.log("Artifact budget gate PASS");
  } else {
    throw new Error("ArtifactBudgetGate should pass when under budget");
  }
} finally {
  rmSync(temp, { recursive: true, force: true });
  delete process.env.ARTIFACT_PREVIEW_DIR;
  delete process.env.ARTIFACT_SNAPSHOT_DIR;
}
