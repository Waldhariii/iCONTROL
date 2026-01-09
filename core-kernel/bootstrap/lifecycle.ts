import type { ErrorCode } from "../domain/errors/errorCodes";

export const KERNEL_STAGES = [
  "created",
  "initializing",
  "ready",
  "degraded",
  "stopping",
  "stopped"
] as const;

export type KernelStage = typeof KERNEL_STAGES[number];

export type HealthStatus = "ok" | "degraded" | "down";

export type HealthCheck = {
  name: string;
  status: HealthStatus;
  detail?: Record<string, unknown>;
};

export type KernelHealth = {
  status: HealthStatus;
  checks: HealthCheck[];
};

export type LifecycleError = {
  code: ErrorCode;
  message: string;
  detail?: Record<string, unknown>;
};

export interface KernelLifecycle {
  init(): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  getStage(): KernelStage;
  healthCheck(): Promise<KernelHealth>;
  onError?(error: LifecycleError): void;
}
