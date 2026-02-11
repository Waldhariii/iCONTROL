// @ts-nocheck
import type { VerificationModel } from "./model";
import { appendParagraph, appendTable, sectionCard } from "../_shared/uiBlocks";

export function renderVerificationSummary(root: HTMLElement, model: VerificationModel): void {
  const card = sectionCard(model.title);
  appendParagraph(card, model.description);
  root.appendChild(card);
}

export function renderVerificationSafeMode(root: HTMLElement, model: VerificationModel, safeMode: string): void {
  const card = sectionCard("SAFE_MODE self-check");
  appendTable(card, ["Key", "Value"], [
    { Key: "safe_mode", Value: safeMode },
    { Key: "selfcheck_route", Value: model.selfcheckRoute },
    { Key: "source", Value: "modules.registry.json" }
  ]);
  root.appendChild(card);
}

export function renderVerificationRulesTable(root: HTMLElement, model: VerificationModel): void {
  const card = sectionCard("Rules engine inventory");
  appendTable(card, ["Category", "Items"], [
    { Category: "conditions", Items: model.ruleConditions.join(", ") },
    { Category: "effects", Items: model.ruleEffects.join(", ") },
    { Category: "value_refs", Items: model.ruleValueRefs.join(", ") }
  ]);
  root.appendChild(card);
}
