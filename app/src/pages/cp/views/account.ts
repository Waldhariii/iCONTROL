/**
 * ICONTROL_CP_ACCOUNT_VIEW_V2
 * Vues de compte pour l'application ADMINISTRATION (/cp)
 * Complètement indépendant de APP
 * Inclut la gestion de l'utilisateur
 */
import type { AccountModelCp } from "../models/account";
import type { Session } from "/src/localAuth";
import { appendParagraph, appendTable, sectionCard } from "/src/core/ui/uiBlocks";

function renderAccountSummaryCp(root: HTMLElement, model: AccountModelCp, session: Session): void {
  const card = sectionCard("Gestion de l'utilisateur");
  
  // Informations utilisateur
  const userInfoDiv = document.createElement("div");
  userInfoDiv.style.minWidth = "0";
  userInfoDiv.style.boxSizing = "border-box";
  userInfoDiv.setAttribute("style", "margin-top:16px; padding:16px; border:1px solid var(--ic-border, #2b3136); border-radius:12px; background:rgba(255,255,255,0.02);");
  userInfoDiv.innerHTML = `
    <div style="font-size:16px; font-weight:700; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
      <span>👤</span> Informations du profil
    </div>
    <div style="display:grid; gap:12px;">
      <div style="display:flex; justify-content:space-between; padding:12px; background:rgba(255,255,255,0.02); border-radius:8px;">
        <span style="color:var(--ic-mutedText, #a7b0b7);">Nom d'utilisateur</span>
        <span style="font-weight:600;">${session.username}</span>
      </div>
      <div style="display:flex; justify-content:space-between; padding:12px; background:rgba(255,255,255,0.02); border-radius:8px;">
        <span style="color:var(--ic-mutedText, #a7b0b7);">Rôle</span>
        <span style="font-weight:600; color:var(--ic-accent, #7b2cff);">${(session as any).username === "Master" ? "Master" : session.role}</span>
      </div>
      <div style="display:flex; justify-content:space-between; padding:12px; background:rgba(255,255,255,0.02); border-radius:8px;">
        <span style="color:var(--ic-mutedText, #a7b0b7);">Application</span>
        <span style="font-weight:600;">Administration (CP)</span>
      </div>
      <div style="display:flex; justify-content:space-between; padding:12px; background:rgba(255,255,255,0.02); border-radius:8px;">
        <span style="color:var(--ic-mutedText, #a7b0b7);">Session active depuis</span>
        <span style="font-weight:600; color:var(--ic-mutedText, #a7b0b7); font-size:13px;">
          ${new Date(session.issuedAt).toLocaleString('fr-FR')}
        </span>
      </div>
    </div>
    <div style="margin-top:16px; padding-top:16px; border-top:1px solid var(--ic-border, #2b3136); color:var(--ic-mutedText, #a7b0b7); font-size:14px; line-height:1.6;">
      ${model.description}
    </div>
  `;
  card.appendChild(userInfoDiv);
  root.appendChild(card);
}

function renderAccountSettingsKeysCp(root: HTMLElement, model: AccountModelCp): void {
  const card = sectionCard("Settings keys - Administration");
  appendTable(
    card,
    ["Storage key", "Field"],
    model.settingsKeys.map((key) => ({
      "Storage key": "controlx_settings_v1",
      Field: key
    }))
  );
  root.appendChild(card);
}

function renderAccountStorageAllowCp(root: HTMLElement, model: AccountModelCp): void {
  const card = sectionCard("Storage allow list - Administration");
  appendTable(
    card,
    ["Key", "Purpose"],
    model.storageAllow.map((key) => ({
      Key: key,
      Purpose: key.includes("role") ? "Role evaluation" : key.includes("language") ? "Language preference" : key.includes("admin") ? "Admin settings" : key.includes("security") ? "Security settings" : "Theme preference"
    }))
  );
  root.appendChild(card);
}

function renderAccountStorageUsageCp(root: HTMLElement, model: AccountModelCp): void {
  const card = sectionCard("Storage usage - Administration (read-only)");
  const rows = model.storageUsageKeys.map((key) => {
    const hasValue = typeof localStorage !== "undefined" && localStorage.getItem(key) !== null;
    return { Key: key, Status: hasValue ? "present" : "empty" };
  });
  appendTable(card, ["Key", "Status"], rows);
  root.appendChild(card);
}
