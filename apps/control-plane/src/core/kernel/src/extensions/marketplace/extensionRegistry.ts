import type { ExtensionDescriptor, ExtensionId, ExtensionRegistry } from "./extensionRegistry.contract";

const inMemory: ExtensionDescriptor[] = [];

export function createExtensionRegistry(seed?: ExtensionDescriptor[]): ExtensionRegistry {
  if (Array.isArray(seed) && seed.length) {
    inMemory.splice(0, inMemory.length, ...seed);
  }
  return {
    list(): ExtensionDescriptor[] {
      return [...inMemory];
    },
    get(id: ExtensionId): ExtensionDescriptor | null {
      return inMemory.find(x => x.id === id) ?? null;
    },
  };
}
