/**
 * ICONTROL_SCAN_ROUTING_FREE_V1
 * StaticRulesRoutingProvider - Routage par règles statiques (FREE)
 */

import type { RoutingProvider, RoutingHints, RoutingPolicy, RoutingDecisionResult } from "../interfaces";
import type { Document } from "../../domain/types";

export class StaticRulesRoutingProvider implements RoutingProvider {
  isAvailable(): boolean {
    return true; // Toujours disponible en FREE
  }

  async decide(
    document: Document,
    hints: RoutingHints,
    policies: RoutingPolicy[]
  ): Promise<RoutingDecisionResult> {
    // FREE: appliquer règles statiques simples
    // sourceType → destination
    // tags → destination
    // regex sur metadata → destination
    
    const enabledPolicies = policies.filter(p => p.enabled).sort((a, b) => b.priority - a.priority);
    
    for (const policy of enabledPolicies) {
      if (this.matchesCondition(document, hints, policy.condition)) {
        return {
          destinationId: policy.destinationId,
          confidence: 90, // Haute confiance pour règles statiques explicites
          method: "STATIC_RULE",
          reason: `Matched rule: ${policy.ruleId}`,
          requiresTriage: false,
        };
      }
    }
    
    // Aucune règle matchée → nécessite triage manuel
    return {
      confidence: 0,
      method: "MANUAL",
      reason: "No matching static rule found",
      requiresTriage: true,
    };
  }

  private matchesCondition(
    document: Document,
    hints: RoutingHints,
    condition: string
  ): boolean {
    try {
      // Simple condition matching:
      // - "sourceType == 'MOBILE'" → hints.sourceType
      // - "tags.includes('invoice')" → hints.tags
      // - "metadata.clientId == '123'" → hints.metadata
      
      // Parse simple JSON path expressions
      const parts = condition.split(".");
      
      if (parts.length === 2) {
        const [key, operator] = parts;
        const [field, value] = operator.split("==").map(s => s.trim());
        
        if (key === "sourceType" && hints.sourceType === value?.replace(/['"]/g, "")) {
          return true;
        }
        
        if (key === "tags" && hints.tags.includes(value?.replace(/['"]/g, ""))) {
          return true;
        }
        
        if (key.startsWith("metadata.") && hints.metadata[key.replace("metadata.", "")] === value?.replace(/['"]/g, "")) {
          return true;
        }
      }
      
      return false;
    } catch {
      return false;
    }
  }
}
