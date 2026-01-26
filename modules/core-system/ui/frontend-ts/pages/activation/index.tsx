/**
 * Product Activation (manual provisioning)
 * Governance:
 * - No import-time navigation side effects
 * - Uses entitlements API (local, tenant-namespaced, SAFE_MODE guarded by storage layer)
 */
import { readEntitlements, writeEntitlements } from "/src/core/entitlements";
import { navigate } from "/src/runtime/navigate";

// Governance: modules pages must not depend on app-only aliases that may not resolve in Vite tests.
// Keep audit signal best-effort without hard dependency.
function auditWarnSafe(message: string, meta?: Record<string, any>) {
  try {
    // If a global audit bus exists at runtime, it can be wired later.
    // For now: keep behavior non-breaking.
    console.warn(`[WARN] ${message}`, meta ?? {});
  } catch {}
}


type State = {
  key: string;
  status: "idle" | "applied" | "cleared" | "error";
  message?: string;
};

function normalizeKey(s: string) {
  return (s || "").trim();
}

/**
 * Minimal policy for now:
 * - Any non-empty key enables PRO.
 * - Later: replace with signed license validation (offline signature check).
 */
function applyKeyToEntitlements(key: string) {
  const k = normalizeKey(key);
  if (!k) return { ok: false, reason: "Clé vide." };

  const cur = readEntitlements();
  const next = {
    ...cur,
    plan: "PRO",
    flags: {
      ...(cur as any).flags,
      "recommendations.pro": true,
    },
    meta: {
      ...(cur as any).meta,
      activation: {
        mode: "manual",
        keyHint: k.slice(0, 4) + "…" + k.slice(-4),
        appliedAt: new Date().toISOString(),
      },
    },
  };

  writeEntitlements(next);
  return { ok: true };
}

function clearEntitlementsToFree() {
  const cur = readEntitlements();
  const next = {
    ...cur,
    plan: "FREE",
    flags: {
      ...(cur as any).flags,
      "recommendations.pro": false,
    },
    meta: {
      ...(cur as any).meta,
      activation: {
        mode: "manual",
        clearedAt: new Date().toISOString(),
      },
    },
  };
  writeEntitlements(next);
  return { ok: true };
}

export function renderActivationPage(mount: HTMLElement) {
  const state: State = { key: "", status: "idle" };

  const rerender = () => {
    const ent = readEntitlements();
    const plan = (ent as any)?.plan || "FREE";
    const pro = !!(ent as any)?.flags?.["recommendations.pro"];

    mount.innerHTML = `
      <div style="padding:22px; max-width:760px;">
        <h2 style="margin:0 0 10px 0;">Activation / Licence</h2>
        <div style="opacity:0.85; margin-bottom:14px;">
          Active le plan PRO localement, sans dépendre d’un fournisseur externe.
          <div style="margin-top:6px; font-size:13px;">
            Statut courant: <b>${plan}</b> — recommendations.pro: <b>${pro ? "ON" : "OFF"}</b>
          </div>
        </div>

        <div style="display:flex; gap:10px; align-items:flex-end; flex-wrap:wrap;">
          <div style="flex:1; min-width:280px;">
            <label style="display:block; font-size:13px; margin-bottom:6px;">Clé d’activation</label>
            <input id="act_key" value="${state.key}"
              placeholder="ex: IC-PRO-XXXX-YYYY-ZZZZ"
              style="width:100%; padding:10px; border:1px solid var(--ic-border); border-radius:10px;" />
          </div>
          <button id="act_apply" style="padding:10px 14px; border-radius:10px; border:1px solid var(--ic-border);">Appliquer</button>
          <button id="act_clear" style="padding:10px 14px; border-radius:10px; border:1px solid var(--ic-border);">Revenir à FREE</button>
          <button id="act_back" style="padding:10px 14px; border-radius:10px; border:1px solid var(--ic-border);">Retour Dashboard</button>
        </div>

        ${state.status !== "idle" ? `
          <div style="margin-top:12px; padding:10px; border-radius:10px; border:1px solid var(--ic-border);">
            <b>${state.status.toUpperCase()}</b>
            ${state.message ? `<div style="margin-top:6px; opacity:0.85;">${state.message}</div>` : ""}
          </div>
        ` : ""}

        <div style="margin-top:16px; font-size:12px; opacity:0.7;">
          Gouvernance: cette page applique une activation locale.
          Plus tard, on branchera une validation de licence signée (offline) + provisioning serveur optionnel.
        </div>
      </div>
    `;

    const keyEl = mount.querySelector<HTMLInputElement>("#act_key")!;
    const applyBtn = mount.querySelector<HTMLButtonElement>("#act_apply")!;
    const clearBtn = mount.querySelector<HTMLButtonElement>("#act_clear")!;
    const backBtn = mount.querySelector<HTMLButtonElement>("#act_back")!;

    keyEl.oninput = () => { state.key = keyEl.value; };

    applyBtn.onclick = () => {
      try {
        const res = applyKeyToEntitlements(state.key);
        if (!res.ok) {
          state.status = "error";
          state.message = res.reason || "Erreur d’activation.";
          (Audit as any).auditWarnSafe("ENTITLEMENTS_ACTIVATION_FAILED", { reason: state.message });
        } else {
          state.status = "applied";
          state.message = "Activation PRO appliquée localement.";
          (Audit as any).auditWarnSafe("ENTITLEMENTS_ACTIVATION_APPLIED", { mode: "manual" });
        }
        rerender();
      } catch (e: any) {
        state.status = "error";
        state.message = e?.message || "Erreur inconnue.";
        (Audit as any).auditWarnSafe("ENTITLEMENTS_ACTIVATION_EXCEPTION", { message: state.message });
        rerender();
      }
    };

    clearBtn.onclick = () => {
      try {
        clearEntitlementsToFree();
        state.status = "cleared";
        state.message = "Retour à FREE appliqué.";
        (Audit as any).auditWarnSafe("ENTITLEMENTS_ACTIVATION_CLEARED", { mode: "manual" });
        rerender();
      } catch (e: any) {
        state.status = "error";
        state.message = e?.message || "Erreur inconnue.";
        (Audit as any).auditWarnSafe("ENTITLEMENTS_CLEAR_EXCEPTION", { message: state.message });
        rerender();
      }
    };

    backBtn.onclick = () => {
      navigate("#/dashboard");
    };
  };

  rerender();
}
