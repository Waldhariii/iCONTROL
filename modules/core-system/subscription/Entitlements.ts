/**
 * Enterprise-grade capabilities are represented as entitlements.
 * Business code must depend on entitlements, not on planId.
 */
export type Entitlements = {
  advancedAudit: boolean;
  unlimitedUsers: boolean;
  externalSync: boolean;
  dataExport: boolean;
};

export const ENTITLEMENTS_ENTERPRISE_FREE: Entitlements = {
  advancedAudit: true,
  unlimitedUsers: true,
  externalSync: false,
  dataExport: true,
};
