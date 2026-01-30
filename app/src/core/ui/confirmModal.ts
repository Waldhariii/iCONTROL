/**
 * ICONTROL_CONFIRM_MODAL_V1
 * Modal de confirmation réutilisable pour actions destructives ou critiques
 */
import { createButton } from "./button";

export interface ConfirmModalOptions {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

function trapFocus(modal: HTMLElement): void {
  const focusable = modal.querySelectorAll<HTMLElement>("button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])");
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  const handleKey = (e: KeyboardEvent) => {
    if (e.key !== "Tab") return;
    if (e.shiftKey) {
      if (document.activeElement === first) { e.preventDefault(); last?.focus(); }
    } else {
      if (document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }
  };
  modal.addEventListener("keydown", handleKey);
  (modal as any).__confirmModalUntrap = () => modal.removeEventListener("keydown", handleKey);
}

export function createConfirmModal(opts: ConfirmModalOptions): { show: () => void; hide: () => void } {
  const {
    title,
    message,
    confirmLabel = "Confirmer",
    cancelLabel = "Annuler",
    danger = false,
    onConfirm,
    onCancel
  } = opts;

  let overlay: HTMLElement | null = null;

  function hide() {
    if (overlay && overlay.parentNode) {
      (overlay.querySelector("[role=dialog]") as any)?.__confirmModalUntrap?.();
      overlay.remove();
      overlay = null;
    }
  }

  function show() {
    hide();
    overlay = document.createElement("div");
    overlay.setAttribute("role", "presentation");
    overlay.className = "ic-modal-overlay";

    const dialog = document.createElement("div");
    dialog.setAttribute("role", "dialog");
    dialog.setAttribute("aria-modal", "true");
    dialog.setAttribute("aria-labelledby", "ic-confirm-title");
    dialog.setAttribute("aria-describedby", "ic-confirm-desc");
    dialog.className = "ic-modal";

    const h = document.createElement("h2");
    h.id = "ic-confirm-title";
    h.textContent = title;
    h.className = "ic-modal__title";

    const p = document.createElement("p");
    p.id = "ic-confirm-desc";
    p.textContent = message;
    p.className = "ic-modal__message";

    const actions = document.createElement("div");
    actions.className = "ic-modal__actions";

    const cancelBtn = createButton({ label: cancelLabel, variant: "secondary", size: "default", onClick: () => { hide(); onCancel(); } });
    const confirmBtn = createButton({
      label: confirmLabel,
      variant: danger ? "danger" : "primary",
      size: "default",
      onClick: () => { hide(); onConfirm(); }
    });

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
    dialog.appendChild(h);
    dialog.appendChild(p);
    dialog.appendChild(actions);
    overlay.appendChild(dialog);

    overlay.onclick = (e) => { if (e.target === overlay) { hide(); onCancel(); } };

    trapFocus(dialog);
    document.body.appendChild(overlay);
    if (danger) cancelBtn.focus(); else confirmBtn.focus();
  }

  return { show, hide };
}
