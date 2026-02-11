/**
 * Extension Registry — Contract First
 * Objectif: marketplace d'extensions versionnées, sandboxées, monétisables.
 */

export type ExtensionId = string;
export type SemVer = string;

export type ExtensionDescriptor = {
  id: ExtensionId;
  version: SemVer;
  name: string;
  publisher: string;
  entrypoint: string; // file/module identifier
  requiredCaps: string[]; // capabilities strings (validated by policy)
};

export interface ExtensionRegistry {
  list(): ExtensionDescriptor[];
  get(id: ExtensionId): ExtensionDescriptor | null;
}
