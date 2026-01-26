/* import "./login.css"; — désactivé: styles visuels retirés */
import { authenticateManagement } from "/src/localAuth";
import { navigate } from "/src/router";
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { getCpLoginPreset, type CpLoginTheme } from "./ui/loginTheme/loginTheme";
import { getEffectiveLoginTheme } from "./ui/loginTheme/loginTheme.override";

const EMAIL_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18v12H3z"/><path d="M3 6l9 7 9-7"/></svg>`;
const LOCK_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`;

export function renderCpLogin(root: HTMLElement): void {
  root.innerHTML = coreBaseStyles();

  const preset = getCpLoginPreset();
  const { theme, effects } = getEffectiveLoginTheme(preset);

  const wrapper = document.createElement("div");
  wrapper.dataset.scope = "cp-login";
  applyThemeVars(wrapper, theme, effects);

  const bg = document.createElement("div");
  bg.className = "cp-login-bg";
  const vignette = document.createElement("div");
  vignette.className = "cp-login-vignette";
  const noise = document.createElement("div");
  noise.className = "cp-login-noise";

  const card = document.createElement("div");
  card.className = "cp-login-card";

  const header = document.createElement("div");
  header.className = "cp-login-header";

  const logoWrap = document.createElement("div");
  logoWrap.className = "cp-login-logo";
  const logoTitle = document.createElement("span");
  logoTitle.className = "cp-logo-title";
  logoTitle.textContent = "iCONTROL";
  const logoAdmin = document.createElement("span");
  logoAdmin.className = "cp-logo-admin";
  logoAdmin.textContent = "ADMIN";
  logoWrap.appendChild(logoTitle);
  logoWrap.appendChild(logoAdmin);

  const langSwitch = document.createElement("div");
  langSwitch.className = "cp-login-lang";
  const langFr = createLangButton("FR", true, langSwitch);
  const langEn = createLangButton("EN", false, langSwitch);
  langSwitch.appendChild(langFr);
  langSwitch.appendChild(langEn);

  header.appendChild(logoWrap);
  header.appendChild(langSwitch);

  const subtitle = document.createElement("div");
  subtitle.className = "cp-login-subtitle";
  subtitle.textContent = "Connexion administrateur";

  const form = document.createElement("div");
  form.className = "cp-login-form";

  const emailField = buildInput("cp-login-email", "email", "Email professionnel", EMAIL_ICON);
  const passwordField = buildInput("cp-login-password", "password", "Mot de passe", LOCK_ICON);

  const error = document.createElement("div");
  error.className = "cp-login-error";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "cp-login-button";
  button.textContent = "Connexion";

  const footer = document.createElement("div");
  footer.className = "cp-login-footer";

  const remember = document.createElement("label");
  remember.className = "cp-login-remember";
  const rememberInput = document.createElement("input");
  rememberInput.type = "checkbox";
  const rememberText = document.createElement("span");
  rememberText.textContent = "Se souvenir de moi";
  remember.appendChild(rememberInput);
  remember.appendChild(rememberText);

  const links = document.createElement("div");
  links.className = "cp-login-links";
  const forgot = document.createElement("a");
  forgot.href = "#/login";
  forgot.textContent = "Mot de passe oublié ?";
  const create = document.createElement("a");
  create.href = "#/login";
  create.textContent = "Créer un compte";
  create.dataset.disabled = "true";
  create.title = "Provisioning requis";
  links.appendChild(forgot);
  links.appendChild(create);

  footer.appendChild(remember);
  footer.appendChild(links);

  form.appendChild(emailField);
  form.appendChild(passwordField);
  form.appendChild(error);
  form.appendChild(button);

  card.appendChild(header);
  card.appendChild(subtitle);
  card.appendChild(form);
  card.appendChild(footer);

  wrapper.appendChild(bg);
  wrapper.appendChild(vignette);
  wrapper.appendChild(noise);
  wrapper.appendChild(card);
  root.appendChild(wrapper);
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (event) => {
      if (event.key !== "icontrol.cp.loginTheme.override.v1") return;
      const next = getEffectiveLoginTheme(getCpLoginPreset());
      applyThemeVars(wrapper, next.theme, next.effects);
    });
  }

  const u = root.querySelector<HTMLInputElement>("#cp-login-email")!;
  const p = root.querySelector<HTMLInputElement>("#cp-login-password")!;
  const err = root.querySelector<HTMLDivElement>(".cp-login-error")!;

  const submit = () => {
    err.textContent = "";
    const res = authenticateManagement(u.value, p.value);
    if (!res.ok) {
      err.textContent = res.error;
      return;
    }
    navigate("#/dashboard");
  };

  button.onclick = submit;
  p.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submit();
  });
}

/** No-op: styles visuels désactivés. La logique (theme, effects) reste pour compatibilité. */
function applyThemeVars(
  _wrapper: HTMLElement,
  _theme: CpLoginTheme,
  _effects: { metallic: { enabled: boolean; intensity: number } }
): void {
  /* Variables --cp-login-* non appliquées. Réactiver le corps si login.css est rétabli. */
}

function buildInput(id: string, type: string, placeholder: string, icon: string): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "cp-login-field";

  const iconWrap = document.createElement("span");
  iconWrap.innerHTML = icon;

  const input = document.createElement("input");
  input.id = id;
  input.type = type;
  input.placeholder = placeholder;
  input.autocomplete = type === "password" ? "current-password" : "username";

  wrap.appendChild(iconWrap);
  wrap.appendChild(input);
  return wrap;
}

function createLangButton(label: string, active: boolean, container: HTMLElement): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.dataset.active = active ? "true" : "false";
  button.onclick = () => {
    if (button.dataset.active === "true") return;
    Array.from(container.querySelectorAll("button")).forEach((item) => {
      const el = item as HTMLButtonElement;
      const isActive = el === button;
      el.dataset.active = isActive ? "true" : "false";
    });
  };
  return button;
}
