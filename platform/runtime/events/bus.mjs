import { emitEvent as emitExtensionEvent } from "../extensions/hooks.mjs";
import { sendWebhook } from "../integrations/dispatcher.mjs";

export async function emitEvent({ manifest, tenantId, event, payload, qosEnforcer }) {
  if (!manifest) return;
  emitExtensionEvent({ manifest, tenantId, event, payload });

  const subs = manifest.integrations?.event_subscriptions || [];
  const webhooks = manifest.integrations?.webhooks || [];
  for (const sub of subs) {
    if (!sub.enabled) continue;
    if (sub.tenant_id !== tenantId) continue;
    if (sub.event !== event) continue;
    const webhook = webhooks.find((w) => w.webhook_id === sub.webhook_id);
    if (!webhook || webhook.direction !== "outbound") continue;
    await sendWebhook({ manifest, tenantId, webhook, event, payload, qosEnforcer });
  }
}
