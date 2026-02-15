import { readFileSync } from "fs";
import { join, dirname } from "path";
import { validatePackSchema, verifyPackJson, verifyChecksums, scanPackForSecrets, writeReport, pickLatestPackDir } from "./release-pack-utils.mjs";

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--pack") out.pack = args[++i];
  }
  return out;
}

async function main() {
  const args = parseArgs();
  const packDir = args.pack || pickLatestPackDir();
  if (!packDir) throw new Error("No pack dir provided or found");
  const packPath = packDir.endsWith("pack.json") ? packDir : join(packDir, "pack.json");
  const pack = JSON.parse(readFileSync(packPath, "utf-8"));
  validatePackSchema(pack);
  const sigOk = verifyPackJson(packPath, "./platform/runtime/keys/manifest-public.pem", join(dirname(packPath), "pack.sig"));
  if (!sigOk) throw new Error("Pack signature invalid");
  verifyChecksums(dirname(packPath), pack.checksums || []);
  scanPackForSecrets([dirname(packPath)]);
  const reportPath = writeReport(
    `AIRGAP_VERIFY_${new Date().toISOString().replace(/[:.]/g, "-")}.md`,
    `AIRGAP OK\npack=${dirname(packPath)}\nrelease=${pack.release_id}\n`
  );
  console.log(`OK AIRGAP: ${dirname(packPath)}`);
  console.log(`Report: ${reportPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
