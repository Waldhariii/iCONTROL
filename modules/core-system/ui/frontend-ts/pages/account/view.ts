import type { AccountModel } from "./model";
import { appendList, appendParagraph, appendTable, sectionCard } from "../_shared/uiBlocks";

export function renderAccountSummary(root: HTMLElement, model: AccountModel): void {
  const card = sectionCard(model.title);
  appendParagraph(card, model.description);
  root.appendChild(card);
}

export function renderAccountSettingsKeys(root: HTMLElement, model: AccountModel): void {
  const card = sectionCard("Settings keys (rules.ts)");
  appendList(card, model.settingsKeys.map((key) => `controlx_settings_v1.${key}`));
  root.appendChild(card);
}

export function renderAccountStorageAllow(root: HTMLElement, model: AccountModel): void {
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
