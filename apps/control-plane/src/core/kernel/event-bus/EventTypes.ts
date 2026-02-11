export const CORE_EVENTS = {
  KERNEL_BOOT_START: "core.kernel.boot.start",
  KERNEL_BOOT_READY: "core.kernel.boot.ready",
  KERNEL_BOOT_FAILED: "core.kernel.boot.failed",
  SAFE_MODE_ENABLED: "core.safe_mode.enabled",
  SAFE_MODE_DISABLED: "core.safe_mode.disabled",
  FEATURE_FLAGS_REFRESHED: "core.feature_flags.refreshed",
  POLICY_EVALUATED: "core.policy.evaluated"
} as const;

export type CoreEventType = typeof CORE_EVENTS[keyof typeof CORE_EVENTS];
