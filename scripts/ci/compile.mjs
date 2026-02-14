import { compileTokens, compilePermissions, compileRoutes, compileNav, compilePages, compileDatasources, compileWorkflows, compilePlatform } from "../../platform/compilers/index.mjs";
import { validateSsotDir } from "../../core/contracts/schema/validate-ssot.mjs";
import { ensureDir } from "../../platform/compilers/utils.mjs";

const releaseId = process.argv[2] || `dev-${Date.now()}`;
const env = process.argv[3] || "dev";

const ssotDir = process.env.SSOT_DIR || "./platform/ssot";
const outDir = process.env.OUT_DIR || "./runtime/manifests";
const privateKeyPath = "./platform/runtime/keys/manifest-private.pem";

ensureDir("./platform/runtime/keys");

globalThis.__icontrol = { releaseId, env };

validateSsotDir(ssotDir);
compileTokens({ ssotDir, outDir, releaseId });
compilePermissions({ ssotDir, outDir, releaseId });
compileRoutes({ ssotDir, outDir, releaseId });
compileNav({ ssotDir, outDir, releaseId });
compilePages({ ssotDir, outDir, releaseId });
compileDatasources({ ssotDir, outDir, releaseId });
compileWorkflows({ ssotDir, outDir, releaseId });
compilePlatform({ ssotDir, outDir, releaseId, env, privateKeyPath });

console.log(`Compiled release ${releaseId} (${env})`);
