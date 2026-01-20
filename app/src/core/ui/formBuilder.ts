/**
 * ICONTROL_FORM_BUILDER_V1
 * Constructeur de formulaires dynamique
 */

import { createFormField, type FormFieldConfig, type FieldType } from "./formField";

export interface FormBuilderConfig {
  fields: FormFieldConfig[];
  onSubmit: (data: Record<string, any>) => void | Promise<void>;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  showCancel?: boolean;
}

export function createFormBuilder(config: FormBuilderConfig): HTMLElement {
  const form = document.createElement("form");
  form.style.cssText = "display: flex; flex-direction: column; gap: 16px;";

  const fields: Array<{
    config: FormFieldConfig;
    container: HTMLElement;
    input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
    errorDiv: HTMLElement;
    validate: () => boolean;
  }> = [];

  // Créer les champs
  config.fields.forEach(fieldConfig => {
    const field = createFormField(fieldConfig);
    fields.push({
      config: fieldConfig,
      ...field
    });
    form.appendChild(field.container);
  });

  // Actions
  const actionsDiv = document.createElement("div");
  actionsDiv.style.minWidth = "0";
  actionsDiv.style.boxSizing = "border-box";
  actionsDiv.style.cssText = "display: flex; gap: 12px; justify-content: flex-end; margin-top: 8px; padding-top: 16px; border-top: 1px solid var(--ic-border, #2b3136);";

  if (config.showCancel !== false && config.onCancel) {
    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.textContent = config.cancelLabel || "Annuler";
    cancelBtn.style.cssText = `
      padding: 10px 20px;
      background: transparent;
      border: 1px solid var(--ic-border, #2b3136);
      color: var(--ic-text, #e7ecef);
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.2s;
    `;
    cancelBtn.onmouseenter = () => { cancelBtn.style.background = "rgba(255,255,255,0.05)"; };
    cancelBtn.onmouseleave = () => { cancelBtn.style.background = "transparent"; };
    cancelBtn.onclick = () => {
      if (config.onCancel) config.onCancel();
    };
    actionsDiv.appendChild(cancelBtn);
  }

  const submitBtn = document.createElement("button");
  submitBtn.type = "submit";
  submitBtn.textContent = config.submitLabel || "Enregistrer";
  submitBtn.style.cssText = `
    padding: 10px 20px;
    background: var(--ic-panel, #37373d);
    border: 1px solid var(--ic-border, #3e3e3e);
    color: white;
    border-radius: 6px;
    cursor: pointer;
    font-weight: 700;
    font-size: 13px;
    transition: all 0.2s;
  `;
  submitBtn.onmouseenter = () => { submitBtn.style.background = "#4a4a50"; };
  submitBtn.onmouseleave = () => { submitBtn.style.background = "var(--ic-panel, #37373d)"; };

  form.appendChild(actionsDiv);

  // Gestion de la soumission
  form.onsubmit = async (e) => {
    e.preventDefault();

    // Valider tous les champs
    let isValid = true;
    fields.forEach(field => {
      if (!field.validate()) {
        isValid = false;
      }
    });

    if (!isValid) {
      return;
    }

    // Collecter les données
    const data: Record<string, any> = {};
    fields.forEach(field => {
      const value = field.input.value;
      if (field.config.type === "checkbox") {
        data[field.config.name] = (field.input as HTMLInputElement).checked;
      } else if (field.config.type === "number") {
        data[field.config.name] = value ? parseFloat(value) : null;
      } else {
        data[field.config.name] = value || null;
      }
    });

    // Désactiver le bouton pendant la soumission
    submitBtn.disabled = true;
    submitBtn.textContent = "Enregistrement...";

    try {
      await config.onSubmit(data);
    } catch (error) {
      console.error("Erreur lors de la soumission:", error);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = config.submitLabel || "Enregistrer";
    }
  };

  actionsDiv.appendChild(submitBtn);

  return form;
}
