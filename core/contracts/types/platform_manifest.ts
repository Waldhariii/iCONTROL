export interface PlatformManifest {
  manifest_id: string;
  manifest_version: string;
  manifest_env: string;
  release_id: string;
  signature: string;
  checksums: Record<string, string>;
  compat_matrix: Record<string, string>;
  routes: Record<string, unknown>;
  nav: Record<string, unknown>;
  pages: Record<string, unknown>;
  widgets: Record<string, unknown>;
  themes: Record<string, unknown>;
  permissions: Record<string, unknown>;
  datasources: Record<string, unknown>;
  workflows: Record<string, unknown>;
  capabilities: string[];
  modules: string[];
}
