// @ts-nocheck
import type { Role } from "/src/runtime/rbac";
import { sectionCard } from "../../_shared/uiBlocks";
import { getSafeMode } from "../../_shared/safeMode";
import { MAIN_SYSTEM_THEME } from "../../_shared/mainSystem.data";
import { isWriteAllowed } from "../../_shared/rolePolicy";
import { createDossier } from "../model";
import { canWrite } from "../contract";

const NOTE_STYLE = `color:${MAIN_SYSTEM_THEME.tokens.mutedText};margin-bottom:8px`;
const BUTTON_DISABLED_COLOR = MAIN_SYSTEM_THEME.tokens.mutedText;

export function renderDossiersCreate(root: HTMLElement, role: Role, onRefresh: () => void): void {
  const card = sectionCard("Creer");
  const safeMode = getSafeMode();
  const writeDecision = isWriteAllowed(safeMode, "dossier.create");
  const writable = canWrite(role) && writeDecision.allow;

  const note = document.createElement("div");
  note.style.cssText = NOTE_STYLE;
  note.textContent = writable
    ? "Creation autorisee."
    : `Creation desactivee (${writeDecision.allow ? "RBAC" : writeDecision.reason}).`;
  card.appendChild(note);

  const form = document.createElement("div");
  form.style.cssText = "display:flex;flex-direction:column;gap:8px;max-width:520px;";

  const title = document.createElement("input");
  title.placeholder = "Titre du dossier";
  title.id = "dossier_title";
  const client = document.createElement("input");
  client.placeholder = "Client";
  client.id = "dossier_client";
  const address = document.createElement("input");
  address.placeholder = "Adresse";
  address.id = "dossier_address";
  const notes = document.createElement("textarea");
  notes.placeholder = "Notes";
  notes.id = "dossier_notes";
  [title, client, address, notes].forEach((el) => {
    el.style.cssText = "padding:8px 10px;border-radius:10px;border:1px solid var(--line);background:transparent;color:inherit;";
  });

  const btn = document.createElement("button");
  btn.type = "button";
  btn.id = "dossier_create_btn";
  btn.textContent = "Nouveau dossier";
  btn.disabled = !writable;
  btn.style.cssText = "padding:8px 12px;border-radius:10px;border:1px solid var(--line);background:transparent;color:inherit;cursor:pointer;";
  if (!writable) btn.style.color = BUTTON_DISABLED_COLOR;

  btn.addEventListener("click", () => {
    if (!writable) return;
    const res = createDossier(role, {
      title: title.value.trim() || "Dossier",
      kind: "INTERVENTION",
      state: "OPEN",
      owner: role,
      clientName: client.value.trim() || undefined,
      address: address.value.trim() || undefined,
      notes: notes.value.trim() || undefined
    });
    if (res.ok) {
      title.value = "";
      client.value = "";
      address.value = "";
      notes.value = "";
      onRefresh();
    }
  });

  form.appendChild(title);
  form.appendChild(client);
  form.appendChild(address);
  form.appendChild(notes);
  form.appendChild(btn);
  card.appendChild(form);
  root.appendChild(card);
}
