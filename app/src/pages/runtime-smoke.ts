import { createDefaultRegistry } from "../core/studio/registry";
import { asRegistryLike, renderRuntime } from "../core/studio/runtime";

// Minimal claims for RBAC gate (render default is USER_READONLY)
const claims = { userId: "local-dev", roles: ["SYSADMIN"] as const };

function el<K extends keyof HTMLElementTagNameMap>(tag: K, attrs?: Record<string, string>, text?: string) {
  const n = document.createElement(tag);
  if (attrs) for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  if (text != null) n.textContent = text;
  return n;
}

/**
 * Runtime Smoke (iCONTROL)
 * - No React dependency (matches your DOM shell architecture).
 * - Exercises: blueprint validate -> rules (noop) -> compile+execute -> safeRender.
 */
export async function renderRuntimeSmoke(mount: HTMLElement): Promise<void> {
  mount.innerHTML = "";

  const header = el("div", { style: "padding:12px;border-bottom:1px solid #ddd;margin-bottom:12px;" });
  header.appendChild(el("h2", {}, "iCONTROL Runtime Smoke"));
  header.appendChild(el("div", { style: "opacity:0.75" }, "Validates core runtime pipeline end-to-end (blueprint → ops → html)."));
  mount.appendChild(header);

  const pre = el("pre", { style: "padding:12px;background:#f7f7f7;border:1px solid #eee;white-space:pre-wrap;" });
  mount.appendChild(pre);

  const registry = createDefaultRegistry();
  const regLike = asRegistryLike(registry);

  // Minimal blueprint doc (presentation kind)
  const blueprint = {
    meta: { kind: "presentation", version: 1 },
    data: {
      blocks: [
        { type: "text", text: "Hello from iCONTROL runtime" },
        { type: "Form" },
        { type: "Table" }
      ]
    }
  };

  const out = renderRuntime(
    { blueprint },
    {
      claims: claims as any,
      requiredRole: "USER_READONLY",
      rules: [],
      registry: regLike as any,
    }
  );

  if (!out.ok) {
    pre.textContent = `RUNTIME_FAIL: ${out.reason}\n${out.detail ?? ""}`;
    return;
  }

  // Show both raw HTML + live preview
  pre.textContent = out.value.html;

  const preview = el("div", { style: "padding:12px;margin-top:12px;border:1px solid #eee;" });
  preview.innerHTML = out.value.html;
  mount.appendChild(el("h3", { style: "margin-top:16px;" }, "Preview"));
  mount.appendChild(preview);
}
