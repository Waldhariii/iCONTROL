import { readJson, writeJson, stableStringify, sha256, signPayload, readKey, verifyPayload } from "./utils.mjs";
import { validateOrThrow } from "../../core/contracts/schema/validate.mjs";

const ALLOWED_CAPABILITIES = [
  "finops.read",
  "qos.read",
  "documents.ingest",
  "jobs.create"
];

const ALLOWED_EVENTS = [
  "on_document_ingested",
  "on_workflow_completed",
  "on_budget_threshold",
  "on_qos_incident"
];

const ALLOWED_HANDLERS = [
  "enqueue_workflow",
  "write_dead_letter",
  "emit_webhook"
];

export function compileExtensions({ ssotDir, outDir, releaseId, privateKeyPath }) {
  const extensions = readJson(`${ssotDir}/extensions/extensions.json`);
  const versions = readJson(`${ssotDir}/extensions/extension_versions.json`);
  const permissions = readJson(`${ssotDir}/extensions/extension_permissions.json`);
  const reviews = readJson(`${ssotDir}/extensions/extension_reviews.json`);
  const publishers = readJson(`${ssotDir}/extensions/publishers.json`);

  const signedArtifacts = [];

  for (const v of versions) {
    validateOrThrow("extension_version.v1", v, `extension_version:${v.extension_id}@${v.version}`);
    const review = reviews.find((r) => r.extension_id === v.extension_id && r.version === v.version && r.status === "approved");
    if (!review) continue;
    const perms = permissions.find((p) => p.extension_id === v.extension_id);
    const requested = perms?.requested_capabilities || [];
    if (requested.some((c) => !ALLOWED_CAPABILITIES.includes(c))) continue;
    if ((v.hooks || []).some((h) => !ALLOWED_EVENTS.includes(h.event) || !ALLOWED_HANDLERS.includes(h.handler))) continue;

    const payload = {
      extension_id: v.extension_id,
      version: v.version,
      manifest_fragment_ref: v.manifest_fragment_ref,
      hooks: v.hooks || [],
      requested_capabilities: requested
    };
    const payloadStr = stableStringify(payload);
    const checksum = `sha256:${sha256(payloadStr)}`;
    if (v.checksum && v.checksum !== checksum) continue;
    let signature = v.signature || "";
    const publisher = extensions.find((e) => e.id === v.extension_id)?.publisher;
    const pub = publishers.find((p) => p.publisher_id === publisher);
    if (signature && pub?.public_key) {
      const ok = verifyPayload(payloadStr, signature, pub.public_key);
      if (!ok) continue;
    } else if (signature && !pub?.public_key) {
      continue;
    } else {
      const privateKey = readKey(privateKeyPath);
      signature = signPayload(payloadStr, privateKey);
    }
    const artifact = { ...payload, checksum, signature };
    const base = outDir.includes("/runtime/manifests")
      ? outDir.replace(/\/runtime\/manifests$/, "/runtime/extensions")
      : `${outDir}/extensions`;
    const outPath = `${base}/${v.extension_id.replace(/[:/]/g, "_")}@${v.version}.signed.json`;
    writeJson(outPath, artifact);
    signedArtifacts.push(artifact);
  }

  return signedArtifacts;
}
