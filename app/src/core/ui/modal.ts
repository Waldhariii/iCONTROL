/**
 * ICONTROL_UI_MODAL_V1
 * Primitive modale SSOT-first (aucun inline style requis).
 * Scope: CP / APP (classes SSOT dans STYLE_*_FINAL.css)
 */
import { showToast } from "./toast";

export type ModalActionTone = "primary" | "secondary" | "danger" | "ghost";

export type ModalAction = {
  id: string;
  label: string;
  tone?: ModalActionTone;
  closeOnClick?: boolean;
  disabled?: boolean;
  onClick?: (ctx: { close: () => void; root: HTMLElement }) => void | Promise<void>;
};

export type ShowModalOptions = {
  title: string;
  description?: string;
  body?: HTMLElement | string;
  size?: "sm" | "md" | "lg";
  dismissOnOverlayClick?: boolean;
  actions?: ModalAction[];
  onClose?: () => void;
  testId?: string;
};

function toneToBtnClass(tone: ModalActionTone | undefined): string {
  switch (tone) {
    case "primary": return "ic-btn ic-btn--primary";
    case "secondary": return "ic-btn ic-btn--secondary";
    case "danger": return "ic-btn ic-btn--danger";
    case "ghost": return "ic-btn ic-btn--ghost";
    default: return "ic-btn ic-btn--secondary";
  }
}

function sizeToClass(size: ShowModalOptions["size"]): string {
  // Si tu veux des sizes plus tard, on branchera CSS; pour l’instant: md par défaut.
  if (size === "sm") return "ic-modal is-sm";
  if (size === "lg") return "ic-modal is-lg";
  return "ic-modal";
}

export function showModal(opts: ShowModalOptions): { close: () => void; root: HTMLElement } {
  const overlay = document.createElement("div");
  overlay.className = "ic-modal-overlay";
  if (opts.testId) overlay.setAttribute("data-testid", opts.testId);

  const modal = document.createElement("div");
  modal.className = sizeToClass(opts.size);

  const header = document.createElement("div");
  header.className = "ic-modal__header";

  const title = document.createElement("div");
  title.className = "ic-modal__title";
  title.textContent = opts.title;

  const closeBtn = document.createElement("button");
  closeBtn.className = "ic-modal__close ic-btn ic-btn--ghost";
  closeBtn.type = "button";
  closeBtn.setAttribute("aria-label", "Fermer");
  closeBtn.textContent = "×";

  header.appendChild(title);
  header.appendChild(closeBtn);

  const bodyWrap = document.createElement("div");
  bodyWrap.className = "ic-modal__body";

  if (opts.description) {
    const desc = document.createElement("div");
    desc.className = "ic-modal__message";
    desc.textContent = opts.description;
    bodyWrap.appendChild(desc);
  }

  if (opts.body) {
    if (typeof opts.body === "string") {
      const p = document.createElement("div");
      p.className = "ic-modal__content";
      p.innerHTML = opts.body;
      bodyWrap.appendChild(p);
    } else {
      opts.body.classList.add("ic-modal__content");
      bodyWrap.appendChild(opts.body);
    }
  }

  const actions = document.createElement("div");
  actions.className = "ic-modal__actions";

  const close = () => {
    try { opts.onClose?.(); } catch {}
    overlay.remove();
  };

  const ctx = { close, root: modal as HTMLElement };

  closeBtn.addEventListener("click", close);

  if (opts.dismissOnOverlayClick !== false) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
  }

  (opts.actions || []).forEach((a) => {
    const btn = document.createElement("button");
    btn.id = a.id;
    btn.type = "button";
    btn.className = toneToBtnClass(a.tone);
    btn.textContent = a.label;
    if (a.disabled) btn.disabled = true;

    btn.addEventListener("click", async () => {
      try {
        await a.onClick?.(ctx);
        if (a.closeOnClick !== false) close();
      } catch (err) {
        showToast({ status: "error", message: String(err ?? "Erreur") });
      }
    });

    actions.appendChild(btn);
  });

  modal.appendChild(header);
  modal.appendChild(bodyWrap);
  if ((opts.actions || []).length > 0) modal.appendChild(actions);

  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  return { close, root: modal };
}
