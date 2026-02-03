// Governed PageSpec (APP surface only). No core impact.
export type RequiredCapability = string;

export type PageSpec = {
  id: string;
  title: string;
  route: string;      // must exist in SSOT route catalog
  moduleKey: string;  // must exist in module catalog
  requiredCapability?: RequiredCapability;
};

export function definePageSpec(spec: PageSpec): PageSpec {
  return Object.freeze({ ...spec });
}
