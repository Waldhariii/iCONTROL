/**
 * ICONTROL_CONFIRM_DIALOG_V1
 * Dialog de confirmation réutilisable
 */

export interface ConfirmDialogOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: "primary" | "danger" | "warning";
  onConfirm: () => void;
  onCancel?: () => void;
}

export function showConfirmDialog(options: ConfirmDialogOptions): void {
  const modal = document.createElement("div");
  modal.style.minWidth = "0";
  modal.style.boxSizing = "border-box";
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;

  const confirmColor = options.confirmColor || "primary";
  const colorStyles = {
    primary: { bg: "#37373d", hover: "#4a4a50", border: "#3e3e3e" },
    danger: { bg: "rgba(244,135,113,0.15)", hover: "rgba(244,135,113,0.25)", border: "#f48771", text: "#f48771" },
    warning: { bg: "rgba(220,220,170,0.15)", hover: "rgba(220,220,170,0.25)", border: "#dcdcaa", text: "#dcdcaa" }
  };
  const color = colorStyles[confirmColor];

  modal.innerHTML = `
    <div style="background:#1e1e1e;border:1px solid #3e3e3e;border-radius:12px;padding:24px;max-width:500px;width:100%;">
      <div style="font-size:18px;font-weight:700;color:#d4d4d4;margin-bottom:16px;">
        ${options.title}
      </div>
      
      <div style="color:#858585;font-size:14px;line-height:1.6;margin-bottom:24px;">
        ${options.message}
      </div>
      
      <div style="display:flex;gap:12px;justify-content:flex-end;">
        <button id="cancelBtn" style="padding:10px 20px;background:transparent;color:#858585;border:1px solid #3e3e3e;border-radius:8px;cursor:pointer;font-weight:600;transition:all 0.2s;">
          ${options.cancelText || "Annuler"}
        </button>
        <button id="confirmBtn" style="padding:10px 20px;background:${color.bg};color:${confirmColor === "danger" || confirmColor === "warning" ? color.text : "white"};border:1px solid ${color.border};border-radius:8px;cursor:pointer;font-weight:700;transition:all 0.2s;">
          ${options.confirmText || "Confirmer"}
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const cancelBtn = modal.querySelector("#cancelBtn") as HTMLButtonElement;
  const confirmBtn = modal.querySelector("#confirmBtn") as HTMLButtonElement;

  cancelBtn.onmouseenter = () => {
    cancelBtn.style.background = "rgba(255,255,255,0.05)";
  };
  cancelBtn.onmouseleave = () => {
    cancelBtn.style.background = "transparent";
  };

  confirmBtn.onmouseenter = () => {
    confirmBtn.style.background = color.hover;
  };
  confirmBtn.onmouseleave = () => {
    confirmBtn.style.background = color.bg;
  };

  cancelBtn.onclick = () => {
    if (options.onCancel) options.onCancel();
    document.body.removeChild(modal);
  };

  confirmBtn.onclick = () => {
    options.onConfirm();
    document.body.removeChild(modal);
  };

  modal.onclick = (e) => {
    if (e.target === modal) {
      if (options.onCancel) options.onCancel();
      document.body.removeChild(modal);
    }
  };
}
