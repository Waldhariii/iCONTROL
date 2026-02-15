import { writeFileSync, existsSync, rmSync, mkdirSync } from "fs";
import { join } from "path";
import { getReportsDir, scanForSecrets } from "./test-utils.mjs";

const reportsDir = getReportsDir();
mkdirSync(reportsDir, { recursive: true });
const badPath = join(reportsDir, "NO_SECRETS_TEST.md");
writeFileSync(badPath, "AKIA1234567890ABCDEF\n", "utf-8");

try {
  const hits = scanForSecrets({ paths: [reportsDir] });
  if (!hits.length) throw new Error("Expected secret scan to detect pattern");
  console.log("No-secrets scanner PASS");
} finally {
  if (existsSync(badPath)) rmSync(badPath);
}
