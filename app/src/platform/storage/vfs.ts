export type VfsScope = {
  tenantId: string;
  namespace: string; // e.g. "core", "ui", "module:<id>"
};

export function vfsKey(scope: VfsScope, key: string): string {
  // Hard namespace boundary
  const ns = scope.namespace.replace(/[^a-zA-Z0-9:_-]/g, "_");
  const t = scope.tenantId.replace(/[^a-zA-Z0-9:_-]/g, "_");
  return `tenant:${t}::ns:${ns}::${key}`;
}

import { webStorage } from "./webStorage";

export const Vfs = {
  get(scope: VfsScope, key: string): string | null {
    return webStorage.get(vfsKey(scope, key));
  },
  set(scope: VfsScope, key: string, value: string): void {
    webStorage.set(vfsKey(scope, key), value);
  },
  del(scope: VfsScope, key: string): void {
    webStorage.del(vfsKey(scope, key));
  },
};
