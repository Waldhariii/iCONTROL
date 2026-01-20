/**
 * ICONTROL_APP_ACCOUNT_VIEW_V1
 * Vues de compte pour l'application CLIENT (/app)
 * Complètement indépendant de CP
 */
import type { AccountModelApp } from "../models/account";
import { appendParagraph, appendTable, sectionCard } from "../../../../../modules/core-system/ui/frontend-ts/pages/_shared/uiBlocks";

export function renderAccountSummaryApp(root: HTMLElement, model: AccountModelApp): void {
  const card = sectionCard(model.title);
  appendParagraph(card, model.description);
  root.appendChild(card);
}

export function renderAccountSettingsKeysApp(root: HTMLElement, model: AccountModelApp): void {
  const card = sectionCard("Settings keys - Client");
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

export function renderAccountStorageAllowApp(root: HTMLElement, model: AccountModelApp): void {
  const card = sectionCard("Storage allow list - Client");
  appendTable(
    card,
    ["Key", "Purpose"],
    model.storageAllow.map((key) => ({
      Key: key,
      Purpose: key.includes("role") ? "Role evaluation" : key.includes("language") ? "Language preference" : "Theme preference"
    }))
  );
  root.appendChild(card);
}

export function renderAccountStorageUsageApp(root: HTMLElement, model: AccountModelApp): void {
  const card = sectionCard("Storage usage - Client (read-only)");
  const rows = model.storageUsageKeys.map((key) => {
    const hasValue = typeof localStorage !== "undefined" && localStorage.getItem(key) !== null;
    return { Key: key, Status: hasValue ? "present" : "empty" };
  });
  appendTable(card, ["Key", "Status"], rows);
  root.appendChild(card);
}
