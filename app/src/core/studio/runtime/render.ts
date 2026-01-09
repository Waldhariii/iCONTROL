import type { RuntimeDeps, RenderRequest, Rendered } from "./types";
import type { RuntimeResult } from "./result";
import { err, ok } from "./result";

import { authorize } from "../../governance/rbac";
import { safeRender } from "../engine";
import { validateBlueprintDoc } from "../blueprints/validate";
import { runRules } from "../rules";

export function renderRuntime(deps: RuntimeDeps, req: RenderRequest): RuntimeResult<Rendered> {
  try {
    // 1) Input validation
    const v = validateBlueprintDoc(req.blueprint, req.blueprint.meta.kind);
    if (!v.ok) return err("invalid_input", `blueprint:${v.reason}`);

    // 2) Authorization (default: USER_READONLY for render)
    const required = deps.requiredRole ?? "USER_READONLY";
    const a = authorize(deps.claims, required);
    if (!a.ok) return err("blocked", `rbac:${a.reason}:${a.required}`);

    // 3) Rules (optional gating)
    const r = runRules(deps.rules, req.blueprint, { nowIso: new Date().toISOString() });
    if (!r.ok && r.reason !== "not_applicable") return err("blocked", `rules:${r.reason}`);

    // 4) Minimal render pipeline
    // For now, blueprint -> string placeholder; we will map to registry later.
    const rawHtml = JSON.stringify(req.blueprint);
    const sr = safeRender(rawHtml);
    if (!sr.ok) return err("blocked", `safe_render:${sr.reason}`);

    return ok({ html: sr.html });
  } catch (e) {
    return err("internal_error", e instanceof Error ? e.message : "unknown");
  }
}
