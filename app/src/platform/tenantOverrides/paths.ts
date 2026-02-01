export function tenantOverridesPath(tenantId: string): string {
  // VFS namespace path (logical)
  return `tenant/${tenantId}/overrides.json`;
}
