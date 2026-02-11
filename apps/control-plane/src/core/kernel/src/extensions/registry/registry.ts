export type ExtensionId = string;

export type ExtensionManifest = {
  id: ExtensionId;
  name: string;
  version: string;
  capabilities: string[];
};

const REGISTRY: Record<ExtensionId, ExtensionManifest> = Object.create(null);

export function registerExtension(m: ExtensionManifest) {
  REGISTRY[m.id] = m;
}

export function getExtension(id: ExtensionId): ExtensionManifest | null {
  return REGISTRY[id] ?? null;
}

export function listExtensions(): ExtensionManifest[] {
  return Object.values(REGISTRY);
}
