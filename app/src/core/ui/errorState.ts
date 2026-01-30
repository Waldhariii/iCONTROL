/**
 * ICONTROL_ERROR_STATE_V1
 * État d'erreur standardisé avec code, message et correlationId
 */
export interface ErrorStateOptions {
  code: string;
  message: string;
  title?: string;
  correlationId?: string;
  onViewLogs?: () => void;
  onCopyCorrelationId?: () => void;
}

const ERROR_ICON = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;

export function createErrorState(options: ErrorStateOptions): HTMLElement {
  const container = document.createElement("div");
  container.className = "ic-error-state";

  const titleRow = document.createElement("div");
  titleRow.className = "ic-error-state__title-row";
  const icon = document.createElement("span");
  icon.className = "ic-error-state__icon";
  icon.innerHTML = ERROR_ICON;
  const title = document.createElement("div");
  title.textContent = options.title ?? "Erreur";
  title.className = "ic-error-state__title";
  titleRow.appendChild(icon);
  titleRow.appendChild(title);
  container.appendChild(titleRow);

  const message = document.createElement("div");
  message.textContent = options.message;
  message.className = "ic-error-state__message";
  container.appendChild(message);

  const meta = document.createElement("div");
  meta.className = "ic-error-state__meta";
  meta.innerHTML = `<span>Code: <strong>${options.code}</strong></span>`;
  if (options.correlationId) {
    meta.innerHTML += `<span>Correlation ID: <strong>${options.correlationId}</strong></span>`;
  }
  container.appendChild(meta);

  const actions = document.createElement("div");
  actions.className = "ic-error-state__actions";
  if (options.onViewLogs) {
    const logsBtn = document.createElement("button");
    logsBtn.className = "ic-error-state__btn";
    logsBtn.textContent = "Voir logs";
    logsBtn.onclick = options.onViewLogs;
    actions.appendChild(logsBtn);
  }

  if (options.correlationId && options.onCopyCorrelationId) {
    const copyBtn = document.createElement("button");
    copyBtn.textContent = "Copier correlationId";
    copyBtn.className = "ic-error-state__btn";
    copyBtn.onclick = options.onCopyCorrelationId;
    actions.appendChild(copyBtn);
  }

  if (actions.childElementCount > 0) {
    container.appendChild(actions);
  }

  return container;
}
