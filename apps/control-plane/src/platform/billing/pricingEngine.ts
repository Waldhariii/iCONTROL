export type UsageSample = {
  tenantId: string;
  ts: string;
  metric: string;
  value: number;
};

export type PricingPlan = {
  planId: string;
  currency: string;
  rules: Array<{ metric: string; unitPrice: number }>;
};

export type InvoiceLine = { metric: string; qty: number; unitPrice: number; total: number };

export function price(usage: UsageSample[], plan: PricingPlan): InvoiceLine[] {
  const agg = new Map<string, number>();
  for (const u of usage) agg.set(u.metric, (agg.get(u.metric) || 0) + u.value);

  const lines: InvoiceLine[] = [];
  for (const r of plan.rules) {
    const qty = agg.get(r.metric) || 0;
    const total = qty * r.unitPrice;
    lines.push({ metric: r.metric, qty, unitPrice: r.unitPrice, total });
  }
  return lines;
}
