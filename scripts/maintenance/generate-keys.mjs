import { generateKeyPairSync } from "crypto";
import { writeFileSync, existsSync, mkdirSync } from "fs";

const outDir = "./platform/runtime/keys";
if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });

const privPath = `${outDir}/manifest-private.pem`;
const pubPath = `${outDir}/manifest-public.pem`;

if (existsSync(privPath) || existsSync(pubPath)) {
  console.log("Keys already exist. Aborting.");
  process.exit(0);
}

const { publicKey, privateKey } = generateKeyPairSync("ed25519", {
  publicKeyEncoding: { type: "spki", format: "pem" },
  privateKeyEncoding: { type: "pkcs8", format: "pem" }
});

writeFileSync(privPath, privateKey);
writeFileSync(pubPath, publicKey);

console.log("Generated keys:", privPath, pubPath);
