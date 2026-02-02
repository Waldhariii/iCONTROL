import { loadEntitlements, saveEntitlements, clearEntitlements, type Entitlements, DEFAULT_ENTITLEMENTS } from "/src/core/entitlements";

function getTenantId(): string {
  // Governance: tenant derivation should come from auth/context.
  // For now, manual mode uses "local" to avoid coupling.
  return "local";
}

function cloneEntitlements(src: Entitlements): Entitlements {
  return { ...src, modules: { ...src.modules } };
}

export function renderDeveloperEntitlements(root: HTMLElement): void {
  const tenantId = getTenantId();
  let e: Entitlements = loadEntitlements(tenantId);
  let moduleKey = "recommendations.pro";

  function persist(next: Entitlements): void {
    e = next;
    saveEntitlements(tenantId, next);
    updateView();
  }

  root.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.style.cssText = "padding:16px;display:grid;gap:12px";

  const title = document.createElement("h1");
  title.textContent = "Entitlements (Provisioning manuel)";
  title.style.cssText = "font-size:18px;font-weight:700";
  wrap.appendChild(title);

  const desc = document.createElement("p");
  desc.style.cssText = "opacity:.85";
  desc.innerHTML = `Objectif: activer/désactiver des capacités PRO/ENTERPRISE sans billing externe. ` +
    `Les entitlements sont stockés localement (web storage) pour le tenant <code>${tenantId}</code>.`;
  wrap.appendChild(desc);

  const card = document.createElement("section");
  card.style.cssText = "border:1px solid var(--ic-borderDark);border-radius:8px;padding:12px";
  const grid = document.createElement("div");
  grid.style.cssText = "display:grid;gap:8px";

  const planLabel = document.createElement("label");
  planLabel.style.cssText = "display:grid;gap:4px";
  const planSpan = document.createElement("span");
  planSpan.textContent = "Plan";
  const planSelect = document.createElement("select");
  ["FREE", "PRO", "ENTERPRISE"].forEach((v) => {
    const opt = document.createElement("option");
    opt.value = v;
    opt.textContent = v;
    planSelect.appendChild(opt);
  });
  planSelect.addEventListener("change", (ev) => {
    const next = { ...e, plan: (ev.target as HTMLSelectElement).value as Entitlements["plan"] };
    persist(next);
  });
  planLabel.appendChild(planSpan);
  planLabel.appendChild(planSelect);
  grid.appendChild(planLabel);

  const moduleLabel = document.createElement("label");
  moduleLabel.style.cssText = "display:grid;gap:4px";
  const moduleSpan = document.createElement("span");
  moduleSpan.textContent = "Module key";
  const moduleInput = document.createElement("input");
  moduleInput.placeholder = "ex: recommendations.pro";
  moduleInput.value = moduleKey;
  moduleInput.addEventListener("input", (ev) => {
    moduleKey = (ev.target as HTMLInputElement).value;
  });
  moduleLabel.appendChild(moduleSpan);
  moduleLabel.appendChild(moduleInput);
  grid.appendChild(moduleLabel);

  const actions = document.createElement("div");
  actions.style.cssText = "display:flex;gap:8px;flex-wrap:wrap";
  const btnEnable = document.createElement("button");
  btnEnable.textContent = "Activer module";
  btnEnable.addEventListener("click", () => {
    persist({ ...e, modules: { ...e.modules, [moduleKey]: true } });
  });
  const btnDisable = document.createElement("button");
  btnDisable.textContent = "Désactiver module";
  btnDisable.addEventListener("click", () => {
    persist({ ...e, modules: { ...e.modules, [moduleKey]: false } });
  });
  const btnReset = document.createElement("button");
  btnReset.textContent = "Reset (FREE)";
  btnReset.addEventListener("click", () => {
    clearEntitlements(tenantId);
    e = cloneEntitlements(DEFAULT_ENTITLEMENTS);
    updateView();
  });
  actions.appendChild(btnEnable);
  actions.appendChild(btnDisable);
  actions.appendChild(btnReset);
  grid.appendChild(actions);

  const details = document.createElement("details");
  const summary = document.createElement("summary");
  summary.textContent = "Voir JSON";
  const jsonPre = document.createElement("pre");
  jsonPre.style.cssText = "background:var(--ic-borderDarkMuted);padding:12px;border-radius:8px;overflow-x:auto";
  details.appendChild(summary);
  details.appendChild(jsonPre);
  grid.appendChild(details);

  card.appendChild(grid);
  wrap.appendChild(card);

  const cardDod = document.createElement("section");
  cardDod.style.cssText = "border:1px solid var(--ic-borderDark);border-radius:8px;padding:12px";
  const dodTitle = document.createElement("h2");
  dodTitle.textContent = "DoD (cette section)";
  dodTitle.style.cssText = "font-size:14px;font-weight:700";
  const dodList = document.createElement("ul");
  dodList.style.cssText = "margin:0;padding-left:18px;display:grid;gap:6px";
  ["Plan & modules activables sans dépendance billing",
    "Stockage tenant-safe (clé par tenant)",
    "Reset rapide vers FREE",
    "Prêt à brancher Stripe plus tard (même modèle Entitlements)"
  ].forEach((t) => {
    const li = document.createElement("li");
    li.textContent = t;
    dodList.appendChild(li);
  });
  cardDod.appendChild(dodTitle);
  cardDod.appendChild(dodList);
  wrap.appendChild(cardDod);

  root.appendChild(wrap);

  function updateView(): void {
    planSelect.value = e.plan;
    jsonPre.textContent = JSON.stringify(e, null, 2);
  }
  updateView();
}

export default renderDeveloperEntitlements;
