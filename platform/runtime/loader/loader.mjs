import { readFileSync, statSync } from "fs";
import { stableStringify, verifyPayload, readKey } from "../../compilers/utils.mjs";

const cache = {
  manifest: null,
  loadedAt: 0,
  releaseId: null
};

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf-8"));
}

export function loadManifest({ releaseId, stalenessMs = 30000, manifestsDir = "./runtime/manifests" }) {
  const now = Date.now();
  if (cache.manifest && cache.releaseId === releaseId && now - cache.loadedAt < stalenessMs) {
    return cache.manifest;
  }

  const manifestPath = `${manifestsDir}/platform_manifest.${releaseId}.json`;
  const sigPath = `${manifestsDir}/platform_manifest.${releaseId}.sig`;
  const publicKeyPath = "./platform/runtime/keys/manifest-public.pem";

  const manifest = readJson(manifestPath);
  const signature = readFileSync(sigPath, "utf-8").trim();

  const payload = stableStringify({ ...manifest, signature: "" });
  const publicKey = readKey(publicKeyPath);
  const ok = verifyPayload(payload, signature, publicKey);
  if (!ok) {
    throw new Error("Invalid manifest signature. Runtime hard stop.");
  }

  cache.manifest = manifest;
  cache.loadedAt = now;
  cache.releaseId = releaseId;

  return manifest;
}

export function getRuntimeState() {
  if (!cache.manifest) return null;
  return {
    release_id: cache.manifest.release_id,
    routes: cache.manifest.routes?.routes?.length || 0,
    pages: cache.manifest.pages?.pages?.length || 0,
    widgets: cache.manifest.widgets?.length || 0,
    themes: cache.manifest.themes?.themes?.length || 0,
    loaded_at: new Date(cache.loadedAt).toISOString()
  };
}

export function getManifestAgeMs() {
  if (!cache.releaseId) return null;
  const manifestPath = `./runtime/manifests/platform_manifest.${cache.releaseId}.json`;
  const stats = statSync(manifestPath);
  return Date.now() - stats.mtimeMs;
}
