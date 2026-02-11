import type { ErrorCode } from "../domain/errors/errorCodes";

export type FeatureFlagValue = boolean | number | string;

export type FeatureFlag = {
  key: string;
  value: FeatureFlagValue;
  source?: "default" | "config" | "remote";
};

export type FeatureFlagError = {
  code: ErrorCode;
  message: string;
  detail?: Record<string, unknown>;
};

export type FeatureFlagResult =
  | { ok: true; flag: FeatureFlag }
  | { ok: false; error: FeatureFlagError };

export interface FeatureFlagsPort {
  getFlag(key: string): Promise<FeatureFlagResult>;
  isEnabled(key: string): Promise<boolean>;
  getAll(): Promise<FeatureFlag[]>;
}
