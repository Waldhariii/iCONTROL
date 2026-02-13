/**
 * WebhookProcessor
 * Traite les webhooks de tous les providers et déclenche les actions
 */

import type { PaymentProvider } from "./types/provider.interface";
import type {
  WebhookPayload,
  WebhookAction,
  WebhookProcessResult,
  WebhookLog,
  WebhookEventType,
} from "./types/webhook.types";

class WebhookProcessorClass {
  private logs: WebhookLog[] = [];

  /**
   * Traiter un webhook reçu
   */
  async processWebhook(
    provider: PaymentProvider,
    payload: WebhookPayload
  ): Promise<WebhookProcessResult> {
    const webhookLog: WebhookLog = {
      id: payload.id,
      provider: provider.id,
      eventType: payload.type,
      receivedAt: payload.createdAt,
      status: "processing",
      actions: [],
    };

    try {
      // 1. Valider le webhook avec le provider
      const webhookResult = await provider.handleWebhook({
        type: payload.type,
        data: payload.data,
      });

      if (!webhookResult.handled) {
        throw new Error("Provider could not handle webhook");
      }

      // 2. Déterminer les actions à exécuter
      const actions = webhookResult.actions || [];
      webhookLog.actions = actions;

      // 3. Exécuter les actions
      const executedActions: WebhookAction[] = [];
      for (const action of actions) {
        await this.executeAction(action);
        executedActions.push(action);
      }

      // 4. Marquer comme succès
      webhookLog.status = "success";
      webhookLog.processedAt = new Date().toISOString();
      this.logs.push(webhookLog);

      return {
        success: true,
        webhookId: payload.id,
        actionsExecuted: executedActions,
      };
    } catch (error) {
      // En cas d'erreur
      webhookLog.status = "failed";
      webhookLog.error = String(error);
      webhookLog.processedAt = new Date().toISOString();
      this.logs.push(webhookLog);

      return {
        success: false,
        webhookId: payload.id,
        actionsExecuted: [],
        errors: [String(error)],
      };
    }
  }

  /**
   * Exécuter une action déterminée par le webhook
   */
  private async executeAction(action: WebhookAction): Promise<void> {
    console.log(`[WebhookProcessor] Executing action:`, action.type, action.payload);

    switch (action.type) {
      case "update_tenant_plan":
        await this.updateTenantPlan(action.payload.tenantId!, action.payload.newPlan!);
        break;

      case "suspend_tenant":
        await this.suspendTenant(action.payload.tenantId!, action.payload.reason);
        break;

      case "activate_tenant":
        await this.activateTenant(action.payload.tenantId!);
        break;

      case "send_email":
        await this.sendEmail(action.payload.email!);
        break;

      case "log_event":
        console.log("[WebhookProcessor] Event logged:", action.payload);
        break;

      default:
        console.warn(`[WebhookProcessor] Unknown action type:`, action.type);
    }
  }

  /**
   * Mettre à jour le plan d'un tenant
   */
  private async updateTenantPlan(tenantId: string, newPlan: string): Promise<void> {
    // Mock: mettre à jour dans localStorage
    const tenants = JSON.parse(localStorage.getItem("tenants") || "[]");
    const updatedTenants = tenants.map((t: any) => {
      if (t.id === tenantId) {
        return { ...t, plan: newPlan, updatedAt: new Date().toISOString() };
      }
      return t;
    });
    localStorage.setItem("tenants", JSON.stringify(updatedTenants));
    console.log(`[WebhookProcessor] Tenant ${tenantId} plan updated to ${newPlan}`);
  }

  /**
   * Suspendre un tenant
   */
  private async suspendTenant(tenantId: string, reason?: string): Promise<void> {
    const tenants = JSON.parse(localStorage.getItem("tenants") || "[]");
    const updatedTenants = tenants.map((t: any) => {
      if (t.id === tenantId) {
        return {
          ...t,
          status: "suspended",
          suspendedReason: reason,
          suspendedAt: new Date().toISOString(),
        };
      }
      return t;
    });
    localStorage.setItem("tenants", JSON.stringify(updatedTenants));
    console.log(`[WebhookProcessor] Tenant ${tenantId} suspended. Reason: ${reason}`);
  }

  /**
   * Activer un tenant
   */
  private async activateTenant(tenantId: string): Promise<void> {
    const tenants = JSON.parse(localStorage.getItem("tenants") || "[]");
    const updatedTenants = tenants.map((t: any) => {
      if (t.id === tenantId) {
        return {
          ...t,
          status: "active",
          suspendedReason: undefined,
          suspendedAt: undefined,
          reactivatedAt: new Date().toISOString(),
        };
      }
      return t;
    });
    localStorage.setItem("tenants", JSON.stringify(updatedTenants));
    console.log(`[WebhookProcessor] Tenant ${tenantId} activated`);
  }

  /**
   * Envoyer un email
   */
  private async sendEmail(emailData: {
    to: string;
    subject: string;
    template: string;
  }): Promise<void> {
    // Mock: logger l'email
    console.log(`[WebhookProcessor] Email sent:`, {
      to: emailData.to,
      subject: emailData.subject,
      template: emailData.template,
    });

    // En production: utiliser SendGrid, AWS SES, etc.
  }

  /**
   * Récupérer l'historique des webhooks
   */
  getWebhookLogs(limit = 50): WebhookLog[] {
    return this.logs
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
      .slice(0, limit);
  }

  /**
   * Récupérer les statistiques des webhooks
   */
  getWebhookStats(): {
    total: number;
    success: number;
    failed: number;
    pending: number;
    byProvider: Record<string, number>;
    byEventType: Record<string, number>;
  } {
    const stats = {
      total: this.logs.length,
      success: 0,
      failed: 0,
      pending: 0,
      byProvider: {} as Record<string, number>,
      byEventType: {} as Record<string, number>,
    };

    this.logs.forEach((log) => {
      if (log.status === "success") stats.success++;
      if (log.status === "failed") stats.failed++;
      if (log.status === "pending") stats.pending++;

      stats.byProvider[log.provider] = (stats.byProvider[log.provider] || 0) + 1;
      stats.byEventType[log.eventType] = (stats.byEventType[log.eventType] || 0) + 1;
    });

    return stats;
  }

  /**
   * Simuler un webhook (pour tests)
   */
  async simulateWebhook(
    provider: PaymentProvider,
    eventType: WebhookEventType,
    data: any
  ): Promise<WebhookProcessResult> {
    const payload: WebhookPayload = {
      id: `webhook_${Date.now()}`,
      type: eventType,
      provider: provider.id,
      createdAt: new Date().toISOString(),
      data,
      rawPayload: JSON.stringify(data),
    };

    return this.processWebhook(provider, payload);
  }
}

// Export singleton
export const WebhookProcessor = new WebhookProcessorClass();
