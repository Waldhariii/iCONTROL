/**
 * ICONTROL_FORM_FIELD_V1
 * Champ de formulaire réutilisable avec validation
 */

export type FieldType = "text" | "email" | "password" | "number" | "select" | "checkbox" | "radio" | "date" | "file" | "textarea";

export interface FieldOption {
  value: string;
  label: string;
}

export interface FormFieldConfig {
  name: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  value?: string;
  required?: boolean;
  options?: FieldOption[];
  validation?: (value: string) => string | null; // Retourne erreur ou null
  helpText?: string;
  disabled?: boolean;
}

export function createFormField(config: FormFieldConfig): {
  container: HTMLElement;
  input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
  errorDiv: HTMLElement;
  validate: () => boolean;
} {
  const container = document.createElement("div");
  container.style.cssText = "margin-bottom: 16px;";

  // Label
  const label = document.createElement("label");
  label.style.cssText = "display: block; color: var(--ic-text, #e7ecef); font-size: 13px; font-weight: 600; margin-bottom: 8px;";
  label.textContent = config.label;
  if (config.required) {
    label.innerHTML += ' <span style="color: #f48771;">*</span>';
  }
  container.appendChild(label);

  // Input/Select/Textarea
  let input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

  if (config.type === "select") {
    input = document.createElement("select");
    (input as HTMLSelectElement).style.cssText = `
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--ic-border, #2b3136);
      border-radius: 6px;
      background: var(--ic-panel, #1a1d1f);
      color: var(--ic-text, #e7ecef);
      font-size: 13px;
      box-sizing: border-box;
    `;
    if (config.options) {
      config.options.forEach(opt => {
        const option = document.createElement("option");
        option.value = opt.value;
        option.textContent = opt.label;
        (input as HTMLSelectElement).appendChild(option);
      });
    }
  } else if (config.type === "textarea") {
    input = document.createElement("textarea");
    (input as HTMLTextAreaElement).style.cssText = `
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--ic-border, #2b3136);
      border-radius: 6px;
      background: var(--ic-panel, #1a1d1f);
      color: var(--ic-text, #e7ecef);
      font-size: 13px;
      min-height: 80px;
      resize: vertical;
      box-sizing: border-box;
      font-family: inherit;
    `;
  } else {
    input = document.createElement("input");
    input.type = config.type;
    input.style.cssText = `
      width: 100%;
      padding: 10px 12px;
      border: 1px solid var(--ic-border, #2b3136);
      border-radius: 6px;
      background: var(--ic-panel, #1a1d1f);
      color: var(--ic-text, #e7ecef);
      font-size: 13px;
      box-sizing: border-box;
    `;
  }

  input.name = config.name;
  if (config.placeholder) input.placeholder = config.placeholder;
  if (config.value) input.value = config.value;
  if (config.disabled) input.disabled = true;

  // Validation visuelle
  const errorDiv = document.createElement("div");
  errorDiv.style.cssText = "color: #f48771; font-size: 12px; margin-top: 4px; display: none;";

  const validate = (): boolean => {
    const value = input.value.trim();
    let error: string | null = null;

    // Validation requise
    if (config.required && !value) {
      error = "Ce champ est obligatoire";
    }

    // Validation personnalisée
    if (!error && config.validation && value) {
      error = config.validation(value);
    }

    // Validation email
    if (!error && config.type === "email" && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        error = "Format d'email invalide";
      }
    }

    // Afficher/masquer erreur
    if (error) {
      errorDiv.textContent = error;
      errorDiv.style.display = "block";
      input.style.borderColor = "#f48771";
      return false;
    } else {
      errorDiv.style.display = "none";
      input.style.borderColor = "var(--ic-border, #2b3136)";
      return true;
    }
  };

  // Validation en temps réel
  input.addEventListener("blur", validate);
  input.addEventListener("input", () => {
    if (errorDiv.style.display !== "none") {
      validate();
    }
  });

  container.appendChild(input);
  container.appendChild(errorDiv);

  // Help text
  if (config.helpText) {
    const helpDiv = document.createElement("div");
    helpDiv.style.cssText = "color: var(--ic-mutedText, #a7b0b7); font-size: 12px; margin-top: 4px;";
    helpDiv.textContent = config.helpText;
    container.appendChild(helpDiv);
  }

  return { container, input, errorDiv, validate };
}
