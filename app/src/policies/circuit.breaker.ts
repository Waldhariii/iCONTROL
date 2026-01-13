type AnyRt = any;

import { noteBreakerCall, noteBreakerOpen, noteBreakerState } from "./breaker.metrics";

export type BreakerState = "CLOSED" | "OPEN" | "HALF_OPEN";

export type BreakerConfig = {
  failureThreshold: number;   // failures to open
  successThreshold: number;   // successes in half-open to close
  openMs: number;             // cool-down
  timeoutMs: number;          // per attempt timeout
  maxRetries: number;         // retry count (additional attempts)
  baseBackoffMs: number;      // base backoff
  maxBackoffMs: number;       // cap
};

export type BreakerSnapshot = {
  key: string;
  state: BreakerState;
  failures: number;
  successes: number;
  openedAt?: string;
  nextAttemptAt?: string;
};

const DEFAULTS: BreakerConfig = {
  failureThreshold: 3,
  successThreshold: 2,
  openMs: 10_000,
  timeoutMs: 2_000,
  maxRetries: 1,
  baseBackoffMs: 25,
  maxBackoffMs: 250,
};

function now(): number {
  return Date.now();
}

function sleep(ms: number): Promise<void> {
  return new Promise(res => setTimeout(res, ms));
}

function jitter(ms: number): number {
  const j = Math.floor(Math.random() * Math.max(1, Math.floor(ms * 0.2)));
  return ms + j;
}

function backoff(attempt: number, cfg: BreakerConfig): number {
  const raw = cfg.baseBackoffMs * Math.pow(2, Math.max(0, attempt - 1));
  return Math.min(cfg.maxBackoffMs, jitter(raw));
}

function ensure(rt: AnyRt) {
  if (!rt) return null;
  if (!rt.__BREAKERS__) rt.__BREAKERS__ = Object.create(null);
  return rt.__BREAKERS__ as Record<string, any>;
}

function get(rt: AnyRt, key: string, cfg: BreakerConfig) {
  const store = ensure(rt);
  if (!store) return null;
  if (!store[key]) {
    store[key] = {
      key,
      state: "CLOSED" as BreakerState,
      failures: 0,
      successes: 0,
      openedAt: null as string | null,
      nextAttemptAt: 0,
      cfg,
    };
  } else {
    store[key].cfg = cfg;
  }
  return store[key];
}

export function snapshotBreaker(rt: AnyRt, key: string): BreakerSnapshot | null {
  const store = ensure(rt);
  if (!store || !store[key]) return null;
  const b = store[key];
  return {
    key: b.key,
    state: b.state,
    failures: b.failures,
    successes: b.successes,
    openedAt: b.openedAt || undefined,
    nextAttemptAt: b.nextAttemptAt ? new Date(b.nextAttemptAt).toISOString() : undefined,
  };
}

function openBreaker(b: any, ts: number) {
  b.state = "OPEN";
  b.openedAt = new Date(ts).toISOString();
  b.nextAttemptAt = ts + b.cfg.openMs;
  b.successes = 0;
}

function halfOpen(b: any) {
  b.state = "HALF_OPEN";
  b.failures = 0;
  b.successes = 0;
}

function closeBreaker(b: any) {
  b.state = "CLOSED";
  b.failures = 0;
  b.successes = 0;
  b.openedAt = null;
  b.nextAttemptAt = 0;
}

export async function withBreaker<T>(
  rt: AnyRt,
  key: string,
  work: () => Promise<T>,
  cfgPatch?: Partial<BreakerConfig>
): Promise<T> {
  const cfg: BreakerConfig = { ...DEFAULTS, ...(cfgPatch || {}) };
  const b = get(rt, key, cfg);
  if (!b) return work();

  const ts = now();

  if (b.state === "OPEN") {
    if (ts >= b.nextAttemptAt) {
      halfOpen(b);
    } else {
      const err: any = new Error(`ERR_BREAKER_OPEN:${key}`);
      err.code = "ERR_BREAKER_OPEN";
      err.key = key;
      try { noteBreakerState(rt, key, b.state); } catch {}
      try { noteBreakerCall(rt, key, "open"); } catch {}
      throw err;
    }
  }

  const attempts = 1 + Math.max(0, cfg.maxRetries);

  let lastErr: any = null;
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await Promise.race([
        work(),
        (async () => {
          await sleep(cfg.timeoutMs);
          const e: any = new Error(`ERR_TIMEOUT:${key}`);
          e.code = "ERR_TIMEOUT";
          e.key = key;
          throw e;
        })(),
      ]);

      if (b.state === "HALF_OPEN") {
        b.successes += 1;
        if (b.successes >= cfg.successThreshold) {
          closeBreaker(b);
        }
      } else {
        // CLOSED success: maintain
        b.failures = 0;
      }

      try { noteBreakerState(rt, key, b.state); } catch {}
      try { noteBreakerCall(rt, key, "ok"); } catch {}
      return res as T;
    } catch (e: any) {
      lastErr = e;

      const outcome = (e && (e.code === "ERR_TIMEOUT")) ? "timeout" : "fail";
      try { noteBreakerCall(rt, key, outcome as any); } catch {}

      if (b.state === "HALF_OPEN") {
        b.failures += 1;
        openBreaker(b, now());
      try { noteBreakerOpen(rt, key); } catch {}
      try { noteBreakerState(rt, key, b.state); } catch {}
      } else {
        b.failures += 1;
        if (b.failures >= cfg.failureThreshold) {
          openBreaker(b, now());
      try { noteBreakerOpen(rt, key); } catch {}
      try { noteBreakerState(rt, key, b.state); } catch {}
        }
      }

      if (i < attempts) {
        await sleep(backoff(i, cfg));
        continue;
      }
      throw lastErr;
    }
  }

  throw lastErr;
}
