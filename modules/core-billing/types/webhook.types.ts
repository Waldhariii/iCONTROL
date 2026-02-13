/**
 * Types pour le système de webhooks universel
 */

export type WebhookEventType =
  | "payment.succeeded"
  | "payment.failed"
  | "subscription.created"
  | "subscription.updated"
  | "subscription.canceled"
  | "subscription.renewed"
  | "invoice.paid"
  | "invoice.payment_failed"
  | "customer.created"
  | "customer.updated";

export interface WebhookPayload {
  id: string;
  type: WebhookEventType;
  provider: string;
  createdAt: string;
  data: any;
  rawPayload: string;
}

export interface WebhookAction {
  type: "update_tenant_plan" | "suspend_tenant" | "activate_tenant" | "send_email" | "log_event";
  payload: {
    tenantId?: string;
    newPlan?: string;
    reason?: string;
    email?: {
      to: string;
      subject: string;
      template: string;
    };
    [key: string]: any;
  };
}

export interface WebhookProcessResult {
  success: boolean;
  webhookId: string;
  actionsExecuted: WebhookAction[];
  errors?: string[];
}

export interface WebhookLog {
  id: string;
  provider: string;
  eventType: WebhookEventType;
  receivedAt: string;
  processedAt?: string;
  status: "pending" | "processing" | "success" | "failed";
  tenantId?: string;
  actions: WebhookAction[];
  error?: string;
}
