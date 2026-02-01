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

// Baseline provider = localStorage (can be swapped later)
export const Vfs = {
  get(scope: VfsScope, key: string): string | null {
    return localStorage.getItem(vfsKey(scope, key));
  },
  set(scope: VfsScope, key: string, value: string): void {
    localStorage.setItem(vfsKey(scope, key), value);
  },
  del(scope: VfsScope, key: string): void {
    localStorage.removeItem(vfsKey(scope, key));
  },
};
