/**
 * CP surface manifest (baseline)
 * PROD: keep minimal; extend via module system later.
 */
export { renderCpPage } from "./registry/Page";

export const cpSurfaceManifest = {
  kind: "cp",
  pages: ["dashboard", "login", "account", "settings"],
} as const;
