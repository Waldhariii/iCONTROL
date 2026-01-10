import type { Role } from "/src/runtime/rbac";
import { sectionCard } from "../../_shared/uiBlocks";
import { getSafeMode } from "../../_shared/safeMode";
import { createDossier } from "../model";
import { canWrite } from "../contract";

export function renderDossiersCreate(root: HTMLElement, role: Role, onRefresh: () => void): void {
  const card = sectionCard("Creer");
  const safeMode = getSafeMode();
  const writable = canWrite(role) && safeMode !== "STRICT";

  const note = document.createElement("div");
  note.style.cssText = "opacity:.8;margin-bottom:8px";
  note.textContent = writable
    ? "Creation autorisee."
    : "Creation desactivee (RBAC ou SAFE_MODE).";
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
  if (!writable) btn.style.opacity = "0.6";

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
