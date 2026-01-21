import "./login.css";
import { authenticateManagement } from "/src/localAuth";
import { navigate } from "/src/router";
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import {
  CP_LOGIN_THEMES,
  DEFAULT_CP_LOGIN_PRESET,
  getCpLoginPreset,
  type CpLoginTheme
} from "./ui/loginTheme/loginTheme";

const EMAIL_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18v12H3z"/><path d="M3 6l9 7 9-7"/></svg>`;
const LOCK_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`;

export function renderCpLogin(root: HTMLElement): void {
  root.innerHTML = coreBaseStyles();

  const preset = getCpLoginPreset();
  const theme = CP_LOGIN_THEMES[preset] ?? CP_LOGIN_THEMES[DEFAULT_CP_LOGIN_PRESET];

  const wrapper = document.createElement("div");
  wrapper.dataset.scope = "cp-login";
  applyThemeVars(wrapper, theme);

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

function applyThemeVars(wrapper: HTMLElement, theme: CpLoginTheme): void {
  const vars: Record<string, string> = {
    "--cp-login-bg-0": theme.bgGradient0,
    "--cp-login-bg-1": theme.bgGradient1,
    "--cp-login-bg-2": theme.bgGradient2,
    "--cp-login-noise": theme.noise,
    "--cp-login-noise-opacity": theme.noiseOpacity,
    "--cp-login-noise-blend": theme.noiseBlendMode,
    "--cp-login-vignette-color": theme.vignetteColor,
    "--cp-login-vignette-opacity": theme.vignetteOpacity,
    "--cp-login-card-bg": theme.cardBg,
    "--cp-login-card-border": theme.cardBorder,
    "--cp-login-card-shadow": theme.cardShadow,
    "--cp-login-card-glow": theme.cardGlow,
    "--cp-login-card-blur": theme.cardBlur,
    "--cp-login-card-radius": theme.cardRadius,
    "--cp-login-font-family": theme.fontFamily,
    "--cp-login-text-primary": theme.textPrimary,
    "--cp-login-text-muted": theme.textMuted,
    "--cp-login-text-label": theme.textLabel,
    "--cp-login-text-size-body": theme.textSizeBody,
    "--cp-login-text-size-small": theme.textSizeSmall,
    "--cp-login-text-size-subtitle": theme.textSizeSubtitle,
    "--cp-login-text-size-tiny": theme.textSizeTiny,
    "--cp-login-text-weight-title": theme.textWeightTitle,
    "--cp-login-text-weight-button": theme.textWeightButton,
    "--cp-login-text-weight-switch": theme.textWeightSwitch,
    "--cp-login-logo-letter-spacing": theme.logoLetterSpacing,
    "--cp-login-admin-letter-spacing": theme.adminLetterSpacing,
    "--cp-login-input-bg": theme.inputBg,
    "--cp-login-input-border": theme.inputBorder,
    "--cp-login-input-text": theme.inputText,
    "--cp-login-input-placeholder": theme.inputPlaceholder,
    "--cp-login-input-icon": theme.inputIcon,
    "--cp-login-button-bg-0": theme.buttonBg0,
    "--cp-login-button-bg-1": theme.buttonBg1,
    "--cp-login-button-text": theme.buttonText,
    "--cp-login-button-glow": theme.buttonGlow,
    "--cp-login-button-letter-spacing": theme.buttonLetterSpacing,
    "--cp-login-link-color": theme.linkColor,
    "--cp-login-focus-ring": theme.focusRing,
    "--cp-login-switch-bg": theme.switchBg,
    "--cp-login-switch-border": theme.switchBorder,
    "--cp-login-switch-text": theme.switchText,
    "--cp-login-switch-active-bg": theme.switchActiveBg,
    "--cp-login-switch-active-text": theme.switchActiveText,
    "--cp-login-checkbox": theme.checkboxAccent,
    "--cp-login-card-width": theme.layout.cardWidth,
    "--cp-login-card-padding": theme.layout.cardPadding,
    "--cp-login-card-gap": theme.layout.cardGap,
    "--cp-login-header-gap": theme.layout.headerGap,
    "--cp-login-header-stack-gap": theme.layout.headerStackGap,
    "--cp-login-logo-size": theme.layout.logoSize,
    "--cp-login-admin-size": theme.layout.adminSize,
    "--cp-login-switch-height": theme.layout.switchHeight,
    "--cp-login-switch-padding": theme.layout.switchPadding,
    "--cp-login-switch-gap": theme.layout.switchGap,
    "--cp-login-switch-font-size": theme.layout.switchFontSize,
    "--cp-login-switch-button-padding": theme.layout.switchButtonPadding,
    "--cp-login-switch-radius": theme.layout.switchRadius,
    "--cp-login-switch-button-radius": theme.layout.switchButtonRadius,
    "--cp-login-input-height": theme.layout.inputHeight,
    "--cp-login-input-radius": theme.layout.inputRadius,
    "--cp-login-input-gap": theme.layout.inputGap,
    "--cp-login-input-inner-gap": theme.layout.inputInnerGap,
    "--cp-login-input-icon-size": theme.layout.inputIconSize,
    "--cp-login-input-padding": theme.layout.inputPadding,
    "--cp-login-button-height": theme.layout.buttonHeight,
    "--cp-login-button-radius": theme.layout.buttonRadius,
    "--cp-login-footer-gap": theme.layout.footerGap,
    "--cp-login-footer-link-gap": theme.layout.footerLinkGap,
    "--cp-login-footer-checkbox-gap": theme.layout.footerCheckboxGap,
    "--cp-login-error-min-height": theme.layout.errorMinHeight
  };

  Object.entries(vars).forEach(([key, value]) => {
    wrapper.style.setProperty(key, value);
  });
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
