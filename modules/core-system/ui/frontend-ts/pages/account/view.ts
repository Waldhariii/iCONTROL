import type { AccountModel } from "./model";
import { appendParagraph, appendTable, sectionCard } from "/src/core/ui/uiBlocks";

export function renderAccountSummary(root: HTMLElement, model: AccountModel): void {
  const card = sectionCard(model.title);
  appendParagraph(card, model.description);
  root.appendChild(card);
}

function renderAccountSettingsKeys(root: HTMLElement, model: AccountModel): void {
  const card = sectionCard("Settings keys (rules.ts)");
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

function renderAccountStorageAllow(root: HTMLElement, model: AccountModel): void {
  const card = sectionCard("Storage allow list");
  appendTable(
    card,
    ["Key", "Purpose"],
    model.storageAllow.map((key) => ({
      Key: key,
      Purpose: key.includes("role")
        ? "Role evaluation"
        : key.includes("language")
          ? "Language preference"
          : "Theme preference"
    }))
  );
  root.appendChild(card);
}

function renderAccountStorageUsage(root: HTMLElement, model: AccountModel): void {
  const card = sectionCard("Storage usage (read-only)");
  const rows = model.storageUsageKeys.map((key) => {
    const hasValue = typeof localStorage !== "undefined" && localStorage.getItem(key) !== null;
    return { Key: key, Status: hasValue ? "present" : "empty" };
  });
  appendTable(card, ["Key", "Status"], rows);
  root.appendChild(card);
}
