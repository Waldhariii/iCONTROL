export type PluginType = "core_free" | "paid_accelerator";

export type PluginState =
  | "registered"
  | "validated"
  | "shadow"
  | "progressive"
  | "active"
  | "throttled"
  | "disabled"
  | "revoked";

export type BlastRadius = "global" | "per_tenant" | "per_module";
export type PiiExposure = "none" | "redacted" | "raw";

export interface PluginManifest {
  plugin_id: string;
  version: string;
  type: PluginType;
  capabilities: string[];
  limits: {
    max_qps: number;
    max_monthly_cost_usd: number;
  };
  fallback: {
    provider: string;
    data_loss: boolean;
  };
  safety: {
    writes_allowed: boolean;
    pii_exposure: PiiExposure;
    blast_radius: BlastRadius;
  };
  sla: {
    max_latency_ms: number;
    availability_pct: number;
  };
  meta?: Record<string, unknown>;
}

export interface PluginInstance {
  manifest: PluginManifest;
  state: PluginState;
  // Activated scope control
  enabledTenants?: string[]; // progressive rollout
  disabledReason?: string;
  lastDecision?: PluginDecision;
}

export interface PluginDecision {
  ts: number;
  plugin_id: string;
  trust_score: number; // 0..100
  action: "keep" | "throttle" | "fallback" | "disable";
  reason: string;
  evidence?: Record<string, unknown>;
}
