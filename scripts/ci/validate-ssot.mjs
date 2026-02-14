import { validateSsotDir } from "../../core/contracts/schema/validate-ssot.mjs";

const ssotDir = "./platform/ssot";
validateSsotDir(ssotDir);
console.log("SSOT validation complete");
