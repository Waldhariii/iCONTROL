import type { PluginInstance, PluginManifest, PluginState, PluginDecision } from "./types";
import { paidKillSwitch } from "../governance/paidKillSwitch";
import { computeTrustScore, decideAction, type PluginTelemetry } from "./decisionEngine";

export interface RegisterResult { ok: boolean; error?: string; }

export class PluginRegistry {
  private plugins = new Map<string, PluginInstance>();

  register(manifest: PluginManifest): RegisterResult {
    if (!manifest?.plugin_id) return { ok: false, error: "missing plugin_id" };
    if (this.plugins.has(manifest.plugin_id)) return { ok: false, error: "plugin already registered" };
    this.plugins.set(manifest.plugin_id, { manifest, state: "registered" });
    return { ok: true };
  }

  get(plugin_id: string): PluginInstance | undefined {
    return this.plugins.get(plugin_id);
  }

  list(): PluginInstance[] {
    return Array.from(this.plugins.values());
  }

  setState(plugin_id: string, state: PluginState, reason?: string): void {
    const p = this.plugins.get(plugin_id);
    if (!p) return;
    p.state = state;
    if (reason) p.disabledReason = reason;
  }

  /**
   * Evaluate trust + apply governance actions (WARN_ONLY by default in caller).
   * Paid kill-switch forces all paid_accelerator plugins to disabled.
   */
  evaluate(plugin_id: string, telemetry: PluginTelemetry): PluginDecision | null {
    const p = this.plugins.get(plugin_id);
    if (!p) return null;

    if (paidKillSwitch.isEnabled() && p.manifest.type === "paid_accelerator") {
      const d: PluginDecision = {
        ts: Date.now(),
        plugin_id,
        trust_score: 0,
        action: "disable",
        reason: "paid_kill_switch_enabled",
        evidence: { kill_switch: true }
      };
      p.lastDecision = d;
      p.state = "disabled";
      p.disabledReason = "kill_switch";
      return d;
    }

    const { score, reason, evidence } = computeTrustScore({
      plugin_id,
      limits: { max_monthly_cost_usd: p.manifest.limits.max_monthly_cost_usd },
      sla: { max_latency_ms: p.manifest.sla.max_latency_ms, availability_pct: p.manifest.sla.availability_pct },
      telemetry
    });

    const decision = decideAction(plugin_id, score, reason, evidence);
    p.lastDecision = decision;

    // Minimal state transitions (caller can choose WARN_ONLY enforcement)
    if (decision.action === "disable") p.state = "disabled";
    else if (decision.action === "fallback") p.state = "throttled";
    else if (decision.action === "throttle") p.state = "throttled";
    else p.state = "active";

    return decision;
  }
}

// Singleton-style default registry (optional)
export const pluginRegistry = new PluginRegistry();
