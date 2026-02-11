import type { Capabilities, EntitlementsContext } from "./types";

function baseCapabilities(): Capabilities {
  return {
    canUseCore: true,
    canUseAdvancedDashboards: false,
    canUseAutomation: false,
    canUseOCR: false,
    canUsePremiumModules: false,
    canAdminGlobalTheme: false,
    canAdminEntitlements: false,
  };
}

export function resolveCapabilities(ctx: EntitlementsContext): Capabilities {
  const caps = baseCapabilities();

  if (ctx.role === "owner" || ctx.role === "admin") {
    caps.canAdminGlobalTheme = true;
    caps.canAdminEntitlements = true;
  }

  switch (ctx.tier) {
    case "free":
      break;
    case "pro":
      caps.canUseAdvancedDashboards = true;
      caps.canUseAutomation = true;
      break;
    case "business":
      caps.canUseAdvancedDashboards = true;
      caps.canUseAutomation = true;
      caps.canUsePremiumModules = true;
      break;
    case "enterprise":
      caps.canUseAdvancedDashboards = true;
      caps.canUseAutomation = true;
      caps.canUsePremiumModules = true;
      caps.canUseOCR = true;
      break;
  }

  if (ctx.features) {
    for (const [k, v] of Object.entries(ctx.features)) {
      if (k === "advancedDashboards") caps.canUseAdvancedDashboards = !!v;
      if (k === "automation") caps.canUseAutomation = !!v;
      if (k === "ocr") caps.canUseOCR = !!v;
      if (k === "premiumModules") caps.canUsePremiumModules = !!v;
      if (k === "adminGlobalTheme") caps.canAdminGlobalTheme = !!v;
      if (k === "adminEntitlements") caps.canAdminEntitlements = !!v;
    }
  }

  return caps;
}
