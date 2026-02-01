/**
 * APP surface manifest (baseline)
 * PROD: keep minimal; extend via module system later.
 */
export { renderAppPage } from "./registry/Page";

export const appSurfaceManifest = {
  kind: "app",
  pages: ["dashboard", "login", "account", "settings"],
} as const;
