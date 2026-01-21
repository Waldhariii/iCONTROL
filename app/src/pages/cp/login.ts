import { authenticateManagement } from "/src/localAuth";
import { navigate } from "/src/router";
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { loadCpLoginLayout, loadCpLoginTheme } from "./ui/loginTheme/loader";

const EMAIL_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18v12H3z"/><path d="M3 6l9 7 9-7"/></svg>`;
const LOCK_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false" width="100%" height="100%" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="10" width="16" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>`;

export function renderCpLogin(root: HTMLElement): void {
  const theme = loadCpLoginTheme();
  const layout = loadCpLoginLayout();

  root.innerHTML = coreBaseStyles();

  const page = document.createElement("div");
  page.style.cssText = `
    min-height: ${layout.page.minHeight};
    padding: ${layout.page.padding};
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${theme.background.gradient};
    color: ${theme.text.primary};
    font-family: ${theme.text.fontFamily};
    position: relative;
    overflow: hidden;
  `;

  const vignette = document.createElement("div");
  vignette.style.cssText = `
    position: absolute;
    inset: 0;
    background: ${theme.background.vignette};
    pointer-events: none;
  `;

  const noise = document.createElement("div");
  noise.style.cssText = `
    position: absolute;
    inset: 0;
    background-image: url("${theme.background.noise}");
    opacity: ${theme.background.noiseOpacity};
    mix-blend-mode: ${theme.background.noiseBlendMode};
    pointer-events: none;
  `;

  const card = document.createElement("div");
  card.style.cssText = `
    width: ${layout.card.width};
    padding: ${layout.card.padding};
    border-radius: ${theme.card.radius};
    background: ${theme.card.bg};
    border: ${theme.card.border};
    box-shadow: ${theme.card.shadow};
    backdrop-filter: blur(${theme.card.blur});
    display: flex;
    flex-direction: column;
    gap: ${layout.card.gap};
    position: relative;
    z-index: 2;
  `;
  card.style.boxShadow = `${theme.card.shadow}, ${theme.card.glow}`;

  const header = document.createElement("div");
  header.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${layout.header.gap};
  `;

  const logoWrap = document.createElement("div");
  logoWrap.style.cssText = `display:flex; flex-direction:column; gap:${layout.header.stackGap};`;

  const logo = document.createElement("div");
  logo.textContent = theme.logo.text;
  logo.style.cssText = `font-weight: ${theme.text.weightTitle}; font-size: ${layout.header.logoSize}; letter-spacing: ${theme.logo.letterSpacing}; color: ${theme.logo.color};`;

  const admin = document.createElement("div");
  admin.textContent = theme.admin.text;
  admin.style.cssText = `font-size: ${layout.header.adminSize}; letter-spacing: ${theme.admin.letterSpacing}; color: ${theme.admin.color};`;

  logoWrap.appendChild(logo);
  logoWrap.appendChild(admin);

  const switchWrap = document.createElement("div");
  switchWrap.style.cssText = `
    display: inline-flex;
    align-items: center;
    gap: ${layout.switch.gap};
    padding: ${layout.switch.padding};
    height: ${layout.switch.height};
    border-radius: ${layout.switch.radius};
    background: ${theme.switch.bg};
    border: ${theme.switch.border};
  `;

  const mkLangButton = (label: string, active = false) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.style.cssText = `
      border: none;
      border-radius: ${layout.switch.buttonRadius};
      padding: ${layout.switch.buttonPadding};
      font-size: ${layout.switch.fontSize};
      font-weight: ${theme.text.weightSwitch};
      cursor: pointer;
      background: ${active ? theme.switch.activeBg : "transparent"};
      color: ${active ? theme.switch.activeText : theme.switch.text};
    `;
    btn.dataset.active = active ? "1" : "0";
    btn.onclick = () => {
      if (btn.dataset.active === "1") return;
      Array.from(switchWrap.querySelectorAll("button")).forEach((el) => {
        const element = el as HTMLButtonElement;
        const isActive = element === btn;
        element.dataset.active = isActive ? "1" : "0";
        element.style.background = isActive ? theme.switch.activeBg : "transparent";
        element.style.color = isActive ? theme.switch.activeText : theme.switch.text;
      });
    };
    return btn;
  };

  switchWrap.appendChild(mkLangButton("FR", true));
  switchWrap.appendChild(mkLangButton("EN", false));

  header.appendChild(logoWrap);
  header.appendChild(switchWrap);

  const subtitle = document.createElement("div");
  subtitle.textContent = theme.copy.subtitle;
  subtitle.style.cssText = `font-size: ${theme.text.sizeSubtitle}; color: ${theme.text.muted};`;

  const form = document.createElement("div");
  form.style.cssText = `display:flex; flex-direction:column; gap: ${layout.input.gap};`;

  const buildInput = (id: string, type: string, placeholder: string, iconSvg: string) => {
    const wrap = document.createElement("div");
    wrap.style.cssText = `
      display: flex;
      align-items: center;
      gap: ${layout.input.innerGap};
      height: ${layout.input.height};
      padding: ${layout.input.padding};
      border-radius: ${layout.input.radius};
      background: ${theme.input.bg};
      border: ${theme.input.border};
      transition: border-color 0.2s ease;
    `;

    const icon = document.createElement("span");
    icon.innerHTML = iconSvg;
    icon.style.cssText = `color: ${theme.input.icon}; display:flex; align-items:center; justify-content:center; width: ${layout.input.iconSize}; height: ${layout.input.iconSize};`;

    const input = document.createElement("input");
    input.id = id;
    input.type = type;
    input.placeholder = placeholder;
    input.autocomplete = type === "password" ? "current-password" : "username";
    input.style.cssText = `
      flex: 1;
      border: none;
      outline: none;
      background: transparent;
      color: ${theme.text.primary};
      font-size: ${theme.text.sizeBody};
    `;
    input.onfocus = () => {
      wrap.style.border = theme.input.focusBorder;
    };
    input.onblur = () => {
      wrap.style.border = theme.input.border;
    };

    const style = document.createElement("style");
    style.textContent = `#${id}::placeholder { color: ${theme.input.placeholder}; }`;
    wrap.appendChild(style);
    wrap.appendChild(icon);
    wrap.appendChild(input);
    return wrap;
  };

  const emailInput = buildInput("cp-login-email", "email", theme.copy.emailPlaceholder, EMAIL_ICON);
  const passInput = buildInput("cp-login-password", "password", theme.copy.passwordPlaceholder, LOCK_ICON);

  const error = document.createElement("div");
  error.id = "cp-login-error";
  error.style.cssText = `min-height: ${layout.form.errorMinHeight}; font-size: ${theme.text.sizeSmall}; color: ${theme.admin.color};`;

  const button = document.createElement("button");
  button.type = "button";
  button.textContent = theme.copy.button;
  button.style.cssText = `
    height: ${layout.button.height};
    border-radius: ${layout.button.radius};
    border: none;
    cursor: pointer;
    font-weight: ${theme.text.weightButton};
    font-size: ${theme.text.sizeBody};
    letter-spacing: ${theme.button.letterSpacing};
    background: ${theme.button.gradient};
    color: ${theme.button.text};
    box-shadow: ${theme.button.glow};
  `;

  const footer = document.createElement("div");
  footer.style.cssText = `
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: ${layout.footer.gap};
    flex-wrap: wrap;
    font-size: ${theme.text.sizeSmall};
    color: ${theme.text.muted};
  `;

  const remember = document.createElement("label");
  remember.style.cssText = `display:flex; align-items:center; gap:${layout.footer.checkboxGap};`;
  const rememberInput = document.createElement("input");
  rememberInput.type = "checkbox";
  rememberInput.style.cssText = `accent-color: ${theme.checkbox.accent};`;
  const rememberText = document.createElement("span");
  rememberText.textContent = theme.copy.remember;
  remember.appendChild(rememberInput);
  remember.appendChild(rememberText);

  const links = document.createElement("div");
  links.style.cssText = `display:flex; align-items:center; gap:${layout.footer.linkGap};`;
  const forgot = document.createElement("a");
  forgot.href = "#/login";
  forgot.textContent = theme.copy.forgot;
  forgot.style.cssText = `color: ${theme.link.color}; text-decoration: none;`;
  const create = document.createElement("a");
  create.href = "#/login";
  create.textContent = theme.copy.create;
  create.style.cssText = `color: ${theme.link.color}; text-decoration: none;`;
  links.appendChild(forgot);
  links.appendChild(create);

  footer.appendChild(remember);
  footer.appendChild(links);

  form.appendChild(emailInput);
  form.appendChild(passInput);
  form.appendChild(error);
  form.appendChild(button);

  const sectionMap: Record<string, HTMLElement> = {
    header,
    subtitle,
    form,
    footer
  };
  const order = Array.isArray(layout.order) ? layout.order : ["header", "subtitle", "form", "footer"];
  order.forEach((key) => {
    const section = sectionMap[key];
    if (section) card.appendChild(section);
  });

  page.appendChild(vignette);
  page.appendChild(noise);
  page.appendChild(card);
  root.appendChild(page);

  const u = root.querySelector<HTMLInputElement>("#cp-login-email")!;
  const p = root.querySelector<HTMLInputElement>("#cp-login-password")!;
  const err = root.querySelector<HTMLDivElement>("#cp-login-error")!;

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
