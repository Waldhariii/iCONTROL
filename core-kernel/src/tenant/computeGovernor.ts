export type TenantComputeBudget = {
  tenantId: string;
  maxInFlight: number;
  maxQueueDepth: number;
};

type State = { inFlight: number; queued: number };

const state = new Map<string, State>();

export function canEnqueue(b: TenantComputeBudget): boolean {
  const s = state.get(b.tenantId) || { inFlight: 0, queued: 0 };
  return s.queued < b.maxQueueDepth;
}

export function onEnqueue(tenantId: string): void {
  const s = state.get(tenantId) || { inFlight: 0, queued: 0 };
  s.queued += 1;
  state.set(tenantId, s);
}

export function onStart(tenantId: string): void {
  const s = state.get(tenantId) || { inFlight: 0, queued: 0 };
  if (s.queued > 0) s.queued -= 1;
  s.inFlight += 1;
  state.set(tenantId, s);
}

export function onDone(tenantId: string): void {
  const s = state.get(tenantId) || { inFlight: 0, queued: 0 };
  if (s.inFlight > 0) s.inFlight -= 1;
  state.set(tenantId, s);
}

export function snapshot(): Record<string, State> {
  const out: Record<string, State> = {};
  for (const [k, v] of state.entries()) out[k] = { ...v };
  return out;
}
