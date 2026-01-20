/**
 * ICONTROL_ERROR_STATE_V1
 * État d'erreur standardisé avec code, message et correlationId
 */
export interface ErrorStateOptions {
  code: string;
  message: string;
  correlationId?: string;
  onViewLogs?: () => void;
  onCopyCorrelationId?: () => void;
}

export function createErrorState(options: ErrorStateOptions): HTMLElement {
  const container = document.createElement("div");
  container.style.minWidth = "0";
  container.style.boxSizing = "border-box";
  container.style.cssText = `
    padding: 24px;
    border: 1px solid rgba(244,135,113,0.4);
    background: rgba(244,135,113,0.08);
    border-radius: 10px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  `;

  const title = document.createElement("div");
  title.textContent = "Erreur";
  title.style.cssText = "font-size: 14px; font-weight: 700; color: #f48771;";
  container.appendChild(title);

  const message = document.createElement("div");
  message.textContent = options.message;
  message.style.cssText = "font-size: 13px; color: var(--ic-text, #e7ecef);";
  container.appendChild(message);

  const meta = document.createElement("div");
  meta.style.cssText = "display:flex; gap:12px; flex-wrap:wrap; font-size: 12px; color: var(--ic-mutedText, #a7b0b7);";
  meta.innerHTML = `<span>Code: <strong>${options.code}</strong></span>`;
  if (options.correlationId) {
    meta.innerHTML += `<span>Correlation ID: <strong>${options.correlationId}</strong></span>`;
  }
  container.appendChild(meta);

  const actions = document.createElement("div");
  actions.style.cssText = "display:flex; gap:8px; flex-wrap:wrap;";
  if (options.onViewLogs) {
    const logsBtn = document.createElement("button");
    logsBtn.textContent = "Voir logs";
    logsBtn.style.cssText = `
      padding: 6px 10px;
      border-radius: 8px;
      border: 1px solid var(--ic-border, #2b3136);
      background: transparent;
      color: var(--ic-text, #e7ecef);
      font-size: 12px;
      cursor: pointer;
    `;
    logsBtn.onclick = options.onViewLogs;
    actions.appendChild(logsBtn);
  }

  if (options.correlationId && options.onCopyCorrelationId) {
    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copier correlationId";
    copyBtn.style.cssText = `
      padding: 6px 10px;
      border-radius: 8px;
      border: 1px solid var(--ic-border, #2b3136);
      background: transparent;
      color: var(--ic-text, #e7ecef);
      font-size: 12px;
      cursor: pointer;
    `;
    copyBtn.onclick = options.onCopyCorrelationId;
    actions.appendChild(copyBtn);
  }

  if (actions.childElementCount > 0) {
    container.appendChild(actions);
  }

  return container;
}
