import { asStorage } from "../../../../../../shared/storage/webStorage";
import type { Role } from "/src/runtime/rbac";
import { getSafeMode } from "../_shared/safeMode";
import { recordObs } from "../_shared/audit";
import { OBS } from "../_shared/obsCodes";
import { isWriteAllowed } from "../_shared/rolePolicy";
import { canWrite } from "./contract";

export type DossierState = "OPEN" | "IN_PROGRESS" | "WAITING" | "CLOSED";
export type DossierKind = "INTERVENTION";

export type DossierHistoryEntry = {
  ts: string;
  actorRole: Role;
  actionId: string;
  meta?: string;
};

export type Dossier = {
  id: string;
  title: string;
  kind: DossierKind;
  state: DossierState;
  owner: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
  clientName?: string;
  address?: string;
  history: DossierHistoryEntry[];
};

const STORAGE_KEY = "icontrol_dossiers_v1";

export function listDossiers(storage: Storage = asStorage()): Dossier[] {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Dossier[];
    if (!Array.isArray(parsed)) return [];
    return parsed.map((d) => ({
      ...d,
      history: Array.isArray(d.history) ? d.history : []
    }));
  } catch {
    return [];
  }
}

function writeAll(storage: Storage, rows: Dossier[]): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function createDossier(
  role: Role,
  payload: Omit<Dossier, "id" | "createdAt" | "updatedAt">,
  storage: Storage = asStorage()
): { ok: true; dossier: Dossier } | { ok: false; reason: string } {
  if (!canWrite(role)) {
    recordObs({ code: OBS.WARN_ACTION_BLOCKED, actionId: "dossier.create", detail: "rbac" });
    return { ok: false, reason: "rbac" };
  }
  const writeDecision = isWriteAllowed(getSafeMode(), "dossier.create");
  if (!writeDecision.allow) {
    recordObs({ code: OBS.WARN_SAFE_MODE_WRITE_BLOCKED, actionId: "dossier.create", detail: writeDecision.reason });
    return { ok: false, reason: writeDecision.reason };
  }
  const now = new Date().toISOString();
  const dossier: Dossier = {
    ...payload,
    id: `DOS-${Math.random().toString(36).slice(2, 10).toUpperCase()}`,
    createdAt: now,
    updatedAt: now,
    history: []
  };
  appendHistory(dossier, role, "dossier.create", dossier.id);
  const rows = listDossiers(storage);
  rows.unshift(dossier);
  writeAll(storage, rows);
  recordObs({ code: OBS.INFO_WRITE_OK, actionId: "dossier.create", detail: dossier.id });
  return { ok: true, dossier };
}

export function updateDossier(
  role: Role,
  id: string,
  patch: Partial<Dossier>,
  storage: Storage = asStorage()
): { ok: true; dossier: Dossier } | { ok: false; reason: string } {
  const rows = listDossiers(storage);
  const idx = rows.findIndex((d) => d.id === id);
  if (idx === -1) return { ok: false, reason: "not_found" };
  const current = rows[idx];
  if (!canWrite(role)) {
    recordObs({ code: OBS.WARN_ACTION_BLOCKED, actionId: "dossier.update", detail: "rbac" });
    return { ok: false, reason: "rbac" };
  }
  const writeDecision = isWriteAllowed(getSafeMode(), "dossier.update");
  if (!writeDecision.allow) {
    recordObs({ code: OBS.WARN_SAFE_MODE_WRITE_BLOCKED, actionId: "dossier.update", detail: writeDecision.reason });
    return { ok: false, reason: writeDecision.reason };
  }
  if (current.state === "CLOSED") {
    recordObs({ code: OBS.WARN_ACTION_BLOCKED, actionId: "dossier.update", detail: "state_blocked" });
    return { ok: false, reason: "state_blocked" };
  }
  const next: Dossier = { ...current, ...patch, updatedAt: new Date().toISOString() };
  appendHistory(next, role, "dossier.update", id);
  rows[idx] = next;
  writeAll(storage, rows);
  recordObs({ code: OBS.INFO_WRITE_OK, actionId: "dossier.update", detail: id });
  return { ok: true, dossier: next };
}

export function setDossierState(
  role: Role,
  id: string,
  nextState: DossierState,
  storage: Storage = asStorage()
): { ok: true; dossier: Dossier } | { ok: false; reason: string } {
  return transitionDossier(role, id, nextState, storage);
}

export function transitionDossier(
  role: Role,
  id: string,
  nextState: DossierState,
  storage: Storage = asStorage()
): { ok: true; dossier: Dossier } | { ok: false; reason: string } {
  const rows = listDossiers(storage);
  const idx = rows.findIndex((d) => d.id === id);
  if (idx === -1) return { ok: false, reason: "not_found" };
  const current = rows[idx];
  if (!canWrite(role)) {
    recordObs({ code: OBS.WARN_ACTION_BLOCKED, actionId: "dossier.state", detail: "rbac" });
    return { ok: false, reason: "rbac" };
  }
  const writeDecision = isWriteAllowed(getSafeMode(), "dossier.state");
  if (!writeDecision.allow) {
    recordObs({ code: OBS.WARN_SAFE_MODE_WRITE_BLOCKED, actionId: "dossier.state", detail: writeDecision.reason });
    return { ok: false, reason: writeDecision.reason };
  }
  if (current.state === "CLOSED") {
    recordObs({ code: OBS.WARN_ACTION_BLOCKED, actionId: "dossier.state", detail: "closed" });
    return { ok: false, reason: "closed" };
  }
  const next: Dossier = { ...current, state: nextState, updatedAt: new Date().toISOString() };
  appendHistory(next, role, "dossier.state", `${id}:${nextState}`);
  rows[idx] = next;
  writeAll(storage, rows);
  recordObs({ code: OBS.INFO_WRITE_OK, actionId: "dossier.state", detail: `${id}:${nextState}` });
  return { ok: true, dossier: next };
}

export function appendHistory(
  dossier: Dossier,
  role: Role,
  actionId: string,
  meta?: string
): void {
  const entry: DossierHistoryEntry = {
    ts: new Date().toISOString(),
    actorRole: role,
    actionId,
    meta
  };
  dossier.history = [...(dossier.history || []), entry];
}

export function getDossier(id: string, storage: Storage = asStorage()): Dossier | undefined {
  return listDossiers(storage).find((d) => d.id === id);
}

export function getStorageUsage(storage: Storage = asStorage()): { key: string; bytes: number } {
  const raw = storage.getItem(STORAGE_KEY) || "";
  return { key: STORAGE_KEY, bytes: raw.length };
}

export function getStorageKey(): string {
  return STORAGE_KEY;
}

export function resetDossiers(
  role: Role,
  storage: Storage = asStorage()
): { ok: true } | { ok: false; reason: string } {
  if (!canWrite(role)) {
    recordObs({ code: OBS.WARN_ACTION_BLOCKED, actionId: "dossier.reset", detail: "rbac" });
    return { ok: false, reason: "rbac" };
  }
  const writeDecision = isWriteAllowed(getSafeMode(), "dossier.reset");
  if (!writeDecision.allow) {
    recordObs({ code: OBS.WARN_SAFE_MODE_WRITE_BLOCKED, actionId: "dossier.reset", detail: writeDecision.reason });
    return { ok: false, reason: writeDecision.reason };
  }
  storage.removeItem(STORAGE_KEY);
  recordObs({ code: OBS.INFO_WRITE_OK, actionId: "dossier.reset", detail: "cleared" });
  return { ok: true };
}

export function createDossiersModel(storage: Storage = asStorage()): {
  dossiers: Dossier[];
  storageKey: string;
  storageBytes: number;
} {
  const dossiers = listDossiers(storage);
  const usage = getStorageUsage(storage);
  return { dossiers, storageKey: usage.key, storageBytes: usage.bytes };
}
