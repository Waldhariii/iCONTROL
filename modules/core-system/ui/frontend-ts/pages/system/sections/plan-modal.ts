// @ts-nocheck
import { el } from "../../_shared/uiBlocks";

interface PlanData {
  id: string;
  name: string;
  displayName: string;
  price?: { monthly: number; yearly: number; currency: string };
  limits: {
    users: number | null;
    tenants: number | null;
    storage: number;
    apiCalls: number | null;
  };
  enabledPages: string[];
  enabledCapabilities: string[];
  enabledModules: string[];
  features?: string[];
  status?: string;
}

const ALL_PAGES = [
  "dashboard_cp", "users_cp", "tenants_cp", "providers_cp", "security_cp",
  "policies_cp", "audit_cp", "settings_cp", "branding_cp", "system_cp",
  "logs_cp", "developer_cp", "entitlements_cp", "pages_cp",
  "dashboard_app", "clients_app", "jobs_app", "account_app", "settings_app"
];

const ALL_CAPABILITIES = [
  "CORE_SYSTEM", "M_DOSSIERS", "SYSTEM_LOGS", "DOCS_OCR",
  "M_CLIENTS", "M_INVENTORY", "M_DOCUMENTS", "M_FINANCE"
];

export function openPlanModal(plan: PlanData | null, onSave: (data: PlanData) => void): void {
  const isEdit = plan !== null;
  
  // Créer l'overlay
  const overlay = el("div");
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
  `;

  // Créer le modal
  const modal = el("div");
  modal.style.cssText = `
    background: var(--surface-1, #171c22);
    border: 1px solid var(--surface-border, #262d35);
    border-radius: 12px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  `;

  // Header
  const header = el("div");
  header.style.cssText = `
    padding: 24px;
    border-bottom: 1px solid var(--surface-border, #262d35);
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;

  const title = el("h2");
  title.textContent = isEdit ? `Modifier ${plan.displayName}` : "Créer un nouveau plan";
  title.style.cssText = `
    margin: 0;
    color: var(--text-primary, #e6e9ee);
    font-size: 24px;
  `;

  const closeBtn = el("button");
  closeBtn.textContent = "×";
  closeBtn.style.cssText = `
    background: none;
    border: none;
    color: var(--text-muted, #9aa3ad);
    font-size: 32px;
    cursor: pointer;
    padding: 0;
    width: 32px;
    height: 32px;
    line-height: 1;
  `;
  closeBtn.onclick = () => overlay.remove();

  header.appendChild(title);
  header.appendChild(closeBtn);
  modal.appendChild(header);

  // Formulaire
  const form = el("form");
  form.style.cssText = `padding: 24px;`;

  // Section 1: Informations de base
  const section1 = createSection("Informations de base");
  
  const nameInput = createInput("Nom du plan", "text", plan?.name || "", "FREE, PRO, ENTERPRISE", true);
  const displayNameInput = createInput("Nom d'affichage", "text", plan?.displayName || "", "Plan Gratuit", true);
  
  section1.appendChild(nameInput.container);
  section1.appendChild(displayNameInput.container);
  form.appendChild(section1);

  // Section 2: Prix
  const section2 = createSection("Tarification");
  
  const priceGrid = el("div");
  priceGrid.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 16px;
  `;

  const monthlyInput = createInput("Prix mensuel", "number", plan?.price?.monthly?.toString() || "0", "0", false);
  const yearlyInput = createInput("Prix annuel", "number", plan?.price?.yearly?.toString() || "0", "0", false);
  const currencySelect = createSelect("Devise", ["CAD", "USD", "EUR"], plan?.price?.currency || "CAD");

  priceGrid.appendChild(monthlyInput.container);
  priceGrid.appendChild(yearlyInput.container);
  priceGrid.appendChild(currencySelect.container);
  section2.appendChild(priceGrid);
  form.appendChild(section2);

  // Section 3: Limites
  const section3 = createSection("Limites");
  
  const limitsGrid = el("div");
  limitsGrid.style.cssText = `
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  `;

  const usersInput = createInput("Utilisateurs max", "number", plan?.limits?.users?.toString() || "5", "0 = illimité", false);
  const tenantsInput = createInput("Tenants max", "number", plan?.limits?.tenants?.toString() || "1", "0 = illimité", false);
  const storageInput = createInput("Stockage (GB)", "number", plan?.limits?.storage?.toString() || "1", "En gigabytes", false);
  const apiCallsInput = createInput("API Calls/mois", "number", plan?.limits?.apiCalls?.toString() || "1000", "0 = illimité", false);

  limitsGrid.appendChild(usersInput.container);
  limitsGrid.appendChild(tenantsInput.container);
  limitsGrid.appendChild(storageInput.container);
  limitsGrid.appendChild(apiCallsInput.container);
  section3.appendChild(limitsGrid);
  form.appendChild(section3);

  // Section 4: Pages autorisées
  const section4 = createSection("Pages autorisées");
  const pagesCheckboxes = createCheckboxGroup("Pages", ALL_PAGES, plan?.enabledPages || []);
  section4.appendChild(pagesCheckboxes.container);
  form.appendChild(section4);

  // Section 5: Capabilities
  const section5 = createSection("Capabilities");
  const capsCheckboxes = createCheckboxGroup("Capabilities", ALL_CAPABILITIES, plan?.enabledCapabilities || []);
  section5.appendChild(capsCheckboxes.container);
  form.appendChild(section5);

  // Boutons
  const footer = el("div");
  footer.style.cssText = `
    padding: 24px;
    border-top: 1px solid var(--surface-border, #262d35);
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  `;

  const cancelBtn = el("button");
  cancelBtn.type = "button";
  cancelBtn.textContent = "Annuler";
  cancelBtn.style.cssText = `
    padding: 12px 24px;
    background: var(--surface-0, #12161b);
    border: 1px solid var(--surface-border, #262d35);
    border-radius: 6px;
    color: var(--text-primary, #e6e9ee);
    cursor: pointer;
    font-weight: 500;
  `;
  cancelBtn.onclick = () => overlay.remove();

  const saveBtn = el("button");
  saveBtn.type = "submit";
  saveBtn.textContent = isEdit ? "Sauvegarder" : "Créer";
  saveBtn.style.cssText = `
    padding: 12px 24px;
    background: var(--accent-primary, #5a8fff);
    border: none;
    border-radius: 6px;
    color: white;
    cursor: pointer;
    font-weight: 600;
  `;

  footer.appendChild(cancelBtn);
  footer.appendChild(saveBtn);
  modal.appendChild(form);
  modal.appendChild(footer);

  // Submit handler
  form.onsubmit = (e) => {
    e.preventDefault();
    
    const formData: PlanData = {
      id: (plan?.id || nameInput.input.value.toLowerCase()),
      name: nameInput.input.value.toUpperCase(),
      displayName: displayNameInput.input.value,
      price: {
        monthly: parseFloat(monthlyInput.input.value) || 0,
        yearly: parseFloat(yearlyInput.input.value) || 0,
        currency: currencySelect.select.value as "CAD" | "USD" | "EUR",
      },
      limits: {
        users: parseInt(usersInput.input.value) || null,
        tenants: parseInt(tenantsInput.input.value) || null,
        storage: parseInt(storageInput.input.value) || 1,
        apiCalls: parseInt(apiCallsInput.input.value) || null,
      },
      enabledPages: pagesCheckboxes.getSelected(),
      enabledCapabilities: capsCheckboxes.getSelected(),
      enabledModules: plan?.enabledModules || ["core-system"],
    };

    onSave(formData);
    overlay.remove();
  };

  overlay.appendChild(modal);
  document.body.appendChild(overlay);
}

// Helper functions
function createSection(title: string): HTMLElement {
  const section = el("div");
  section.style.cssText = `margin-bottom: 32px;`;
  
  const heading = el("h3");
  heading.textContent = title;
  heading.style.cssText = `
    color: var(--text-primary, #e6e9ee);
    font-size: 18px;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--surface-border, #262d35);
  `;
  
  section.appendChild(heading);
  return section;
}

function createInput(label: string, type: string, value: string, placeholder: string, required: boolean) {
  const container = el("div");
  container.style.cssText = `margin-bottom: 16px;`;
  
  const labelEl = el("label");
  labelEl.textContent = label;
  labelEl.style.cssText = `
    display: block;
    margin-bottom: 6px;
    color: var(--text-primary, #e6e9ee);
    font-weight: 500;
  `;
  
  const input = el("input") as HTMLInputElement;
  input.type = type;
  input.value = value;
  input.placeholder = placeholder;
  input.required = required;
  input.style.cssText = `
    width: 100%;
    padding: 10px 14px;
    background: var(--surface-0, #12161b);
    border: 1px solid var(--surface-border, #262d35);
    border-radius: 6px;
    color: var(--text-primary, #e6e9ee);
    font-size: 14px;
  `;
  
  container.appendChild(labelEl);
  container.appendChild(input);
  
  return { container, input };
}

function createSelect(label: string, options: string[], selected: string) {
  const container = el("div");
  container.style.cssText = `margin-bottom: 16px;`;
  
  const labelEl = el("label");
  labelEl.textContent = label;
  labelEl.style.cssText = `
    display: block;
    margin-bottom: 6px;
    color: var(--text-primary, #e6e9ee);
    font-weight: 500;
  `;
  
  const select = el("select") as HTMLSelectElement;
  select.style.cssText = `
    width: 100%;
    padding: 10px 14px;
    background: var(--surface-0, #12161b);
    border: 1px solid var(--surface-border, #262d35);
    border-radius: 6px;
    color: var(--text-primary, #e6e9ee);
    font-size: 14px;
  `;
  
  options.forEach(opt => {
    const option = el("option") as HTMLOptionElement;
    option.value = opt;
    option.textContent = opt;
    option.selected = opt === selected;
    select.appendChild(option);
  });
  
  container.appendChild(labelEl);
  container.appendChild(select);
  
  return { container, select };
}

function createCheckboxGroup(label: string, items: string[], selected: string[]) {
  const container = el("div");
  container.style.cssText = `margin-bottom: 16px;`;
  
  const labelEl = el("label");
  labelEl.textContent = label;
  labelEl.style.cssText = `
    display: block;
    margin-bottom: 12px;
    color: var(--text-primary, #e6e9ee);
    font-weight: 500;
  `;
  container.appendChild(labelEl);
  
  const checkboxes: HTMLInputElement[] = [];
  
  const grid = el("div");
  grid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    max-height: 200px;
    overflow-y: auto;
    padding: 12px;
    background: var(--surface-0, #12161b);
    border: 1px solid var(--surface-border, #262d35);
    border-radius: 6px;
  `;
  
  items.forEach(item => {
    const wrapper = el("label");
    wrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      color: var(--text-muted, #9aa3ad);
    `;
    
    const checkbox = el("input") as HTMLInputElement;
    checkbox.type = "checkbox";
    checkbox.value = item;
    checkbox.checked = selected.includes(item);
    checkboxes.push(checkbox);
    
    const text = el("span");
    text.textContent = item;
    text.style.cssText = `font-size: 13px;`;
    
    wrapper.appendChild(checkbox);
    wrapper.appendChild(text);
    grid.appendChild(wrapper);
  });
  
  container.appendChild(grid);
  
  return {
    container,
    getSelected: () => checkboxes.filter(cb => cb.checked).map(cb => cb.value)
  };
}
