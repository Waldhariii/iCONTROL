import type { DeveloperModel } from "./model";
import { appendList, appendParagraph, appendPillRow, appendTable, sectionCard } from "../_shared/uiBlocks";

export function renderDeveloperOverview(root: HTMLElement, model: DeveloperModel): void {
  const card = sectionCard(model.title);
  appendParagraph(card, "Surface technique pour contrats, datasources et outils.");
  appendList(card, model.notes);
  root.appendChild(card);
}

export function renderDeveloperToolbox(root: HTMLElement): void {
  const card = sectionCard("Toolbox");
  const link = document.createElement("a");
  link.href = "#/toolbox";
  link.textContent = "Ouvrir Toolbox";
  link.style.cssText = "display:inline-block;margin-top:6px;text-decoration:underline";
  card.appendChild(link);
  root.appendChild(card);
}

export function renderDeveloperTableContract(root: HTMLElement, model: DeveloperModel): void {
  const card = sectionCard("Table contract");
  appendTable(
    card,
    ["Field", "Notes"],
    model.tableContract.columnFields.map((field) => ({
      Field: field,
      Notes: model.tableContract.columnTypes.includes(field) ? "type" : "schema"
    }))
  );
  appendParagraph(card, `Action types: ${model.tableContract.actionTypes.join(", ")}`);
  root.appendChild(card);
}

export function renderDeveloperFormContract(root: HTMLElement, model: DeveloperModel): void {
  const card = sectionCard("Form contract");
  appendPillRow(card, model.formContract.fieldTypes);
  appendParagraph(card, `Validation: ${model.formContract.validation.join(", ")}`);
  root.appendChild(card);
}

export function renderDeveloperDatasources(root: HTMLElement, model: DeveloperModel): void {
  const card = sectionCard("Datasource types");
  appendPillRow(card, model.datasource.types);
  appendParagraph(card, `Query ops: ${model.datasource.queryOps.join(", ")}`);
  root.appendChild(card);
}
