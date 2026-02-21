/**
 * Anomaly guard: detect 401 storm, login storm, route fallback loop.
 * Emits structured WARN log only. No business logic change.
 * O1 Hardening: 401 burst > 30s → ERROR; expose getAnomalySnapshot().
 * O3: on ERROR escalation call recordAnomalyExport + exportNow.
 */
import { warn } from "./logger";
import { error } from "./logger";
import { recordAnomalyExport, exportNow } from "./exporter";

const WINDOW_401_MS = 10_000;
const WINDOW_LOGIN_MS = 30_000;
const THRESHOLD_401 = 5;
const THRESHOLD_LOGIN = 3;
const FALLBACK_LOOP_COUNT = 3;
const FALLBACK_LOOP_WINDOW_MS = 5_000;
const ESCALATION_401_PERSIST_MS = 30_000;

const recent401: number[] = [];
const recentLoginAttempts: number[] = [];
let lastRouteHash = "";
let fallbackCount = 0;
let lastFallbackTs = 0;
let first401StormWarnTs: number | null = null;

function prune(arr: number[], windowMs: number): number[] {
  const cutoff = Date.now() - windowMs;
  return arr.filter((t) => t >= cutoff);
}

export function record401(): void {
  const now = Date.now();
  recent401.push(now);
  const inWindow = prune(recent401, WINDOW_401_MS);
  if (inWindow.length > THRESHOLD_401) {
    const payload = { count: inWindow.length, windowMs: WINDOW_401_MS, threshold: THRESHOLD_401 };
    if (first401StormWarnTs !== null && now - first401StormWarnTs > ESCALATION_401_PERSIST_MS) {
      error("ERR_ANOMALY_401_PERSIST", "401 burst persists beyond 30s", { payload: { ...payload, persistMs: ESCALATION_401_PERSIST_MS } });
      first401StormWarnTs = null;
      try {
        recordAnomalyExport(getAnomalySnapshot());
        exportNow("anomaly");
      } catch {
        // silent
      }
    } else {
      if (first401StormWarnTs === null) first401StormWarnTs = now;
      warn("WARN_ANOMALY_401_STORM", "Too many 401 in short window", { payload });
    }
    recent401.length = 0;
  } else {
    recent401.length = 0;
    recent401.push(...inWindow);
  }
}


export function recordLoginAttempt(): void {
  const now = Date.now();
  recentLoginAttempts.push(now);
  const inWindow = prune(recentLoginAttempts, WINDOW_LOGIN_MS);
  if (inWindow.length > THRESHOLD_LOGIN) {
    warn("WARN_ANOMALY_LOGIN_STORM", "Too many login attempts in short window", {
      payload: { count: inWindow.length, windowMs: WINDOW_LOGIN_MS, threshold: THRESHOLD_LOGIN },
    });
    recentLoginAttempts.length = 0;
  } else {
    recentLoginAttempts.length = 0;
    recentLoginAttempts.push(...inWindow);
  }
}

export function recordRouteResolution(hash: string, isFallback: boolean): void {
  const now = Date.now();
  if (isFallback) {
    if (hash === lastRouteHash && now - lastFallbackTs < FALLBACK_LOOP_WINDOW_MS) {
      fallbackCount++;
      if (fallbackCount >= FALLBACK_LOOP_COUNT) {
        warn("WARN_ANOMALY_ROUTE_FALLBACK_LOOP", "Route fallback loop detected", {
          payload: { hash, fallbackCount, windowMs: FALLBACK_LOOP_WINDOW_MS },
        });
        fallbackCount = 0;
      }
    } else {
      fallbackCount = 1;
      lastRouteHash = hash;
    }
    lastFallbackTs = now;
  } else {
    lastRouteHash = hash;
    fallbackCount = 0;
  }
}

export type AnomalySnapshot = {
  first401StormWarnTs: number | null;
  recent401Count: number;
  recentLoginAttemptsCount: number;
  lastRouteHash: string;
  fallbackCount: number;
  lastFallbackTs: number;
};

export function getAnomalySnapshot(): AnomalySnapshot {
  return {
    first401StormWarnTs,
    recent401Count: recent401.length,
    recentLoginAttemptsCount: recentLoginAttempts.length,
    lastRouteHash,
    fallbackCount,
    lastFallbackTs,
  };
}

export function initAnomalyGuard(): void {
  // No-op; hooks are called from cpApi (401), authService (login), router (fallback).
}
