// app/src/surfaces/shared/runtime-smoke/Page.ts
import { compilePlan } from "../../core/studio/runtime/plan";
import { executePlan } from "../../core/studio/runtime/execute";
import { safeRender } from "../../core/studio/engine";
import { createDefaultRegistry } from "../../core/studio/registry/defaults";
import { asRegistryLike } from "../../core/studio/runtime/adapters/registry-adapter";
import type { BlueprintDoc } from "../../core/studio/blueprints/types";

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, string>,
  text?: string
): HTMLElementTagNameMap[K] {
  const e = document.createElement(tag);
  if (attrs) Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
  if (text) e.textContent = text;
  return e;
}

export function renderRuntimeSmoke(mount: HTMLElement): void {
  mount.innerHTML = "";
  mount.appendChild(el("h2", {}, "Runtime Smoke Test"));

  const blueprint: BlueprintDoc = {
    meta: { kind: "presentation", version: 1 },
    data: {
      blocks: [
        { type: "text", text: "Hello iCONTROL runtime" },
        { type: "builtin.form", title: "Demo Form", fields: [] },
        { type: "builtin.table", title: "Demo Table", columns: ["A","B"], rows: [] }
      ]
    }
  };

  const registry = asRegistryLike(createDefaultRegistry());

  const cp = compilePlan(blueprint);
  if (!cp.ok) { mount.appendChild(el("pre", {}, "Compile error")); return; }

  const ex = executePlan(cp.value, { registry });
  if (!ex.ok) { mount.appendChild(el("pre", {}, "Execute error")); return; }

  const sr = safeRender(ex.value);
  if (!sr.ok) { mount.appendChild(el("pre", {}, "SafeRender BLOCKED:\n" + JSON.stringify(sr, null, 2))); return; }

  mount.appendChild(el("h3", {}, "Output"));
  const preview = el("div", { style: "padding:12px;border:1px solid var(--ic-border);margin-top:8px;" });
  preview.innerHTML = sr.html;
  mount.appendChild(preview);
}
