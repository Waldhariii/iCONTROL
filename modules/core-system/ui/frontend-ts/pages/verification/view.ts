import type { VerificationModel } from "./model";
import { appendList, appendParagraph, appendTable, sectionCard } from "../_shared/uiBlocks";

export function renderVerificationSummary(root: HTMLElement, model: VerificationModel): void {
  const card = sectionCard(model.title);
  appendParagraph(card, model.description);
  root.appendChild(card);
}

export function renderVerificationSelfcheck(root: HTMLElement, model: VerificationModel): void {
  const card = sectionCard("Selfcheck route");
  appendTable(card, ["Key", "Value"], [
    { Key: "route", Value: model.selfcheckRoute },
    { Key: "source", Value: "modules.registry.json" }
  ]);
  root.appendChild(card);
}

export function renderVerificationRules(root: HTMLElement, model: VerificationModel): void {
  const card = sectionCard("Rule engine (conditions/effects/value refs)");
  appendParagraph(card, "Conditions:");
  appendList(card, model.ruleConditions);
  appendParagraph(card, "Effects:");
  appendList(card, model.ruleEffects);
  appendParagraph(card, "Value refs:");
  appendList(card, model.ruleValueRefs);
  root.appendChild(card);
}
