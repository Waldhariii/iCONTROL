/**
 * Global paid kill-switch (instant fallback).
 * - Must be fast, deterministic, and safe.
 * - Defaults to OFF.
 * - When ON: all paid_accelerator plugins must behave as disabled (core fallback).
 *
 * Note: wiring into runtime config / feature flags is intentionally minimal here.
 */

let _paidKillSwitch = false;

export const paidKillSwitch = {
  isEnabled(): boolean {
    return _paidKillSwitch === true;
  },
  enable(reason = "manual"): void {
    // In a full system, emit audit event here (no PII).
    _paidKillSwitch = true;
    void reason;
  },
  disable(reason = "manual"): void {
    _paidKillSwitch = false;
    void reason;
  }
};
