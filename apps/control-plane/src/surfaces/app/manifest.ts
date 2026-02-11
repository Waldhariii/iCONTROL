/**
 * APP surface manifest (baseline)
 * PROD: keep minimal; extend via module system later.
 */
export { renderAppPage } from "./registry/Page";

export const appSurfaceManifest = {
  kind: "app",
  pages: [
    "home",
    "dashboard",
    "login",
    "account",
    "settings",
    "clients",
    "jobs",
    "gallery",
    "registry",
    "pages-inventory",
  ],
} as const;
