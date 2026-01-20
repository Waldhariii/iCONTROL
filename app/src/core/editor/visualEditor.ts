import { getCurrentHash } from "/src/runtime/navigate";
/**
 * ICONTROL_VISUAL_EDITOR_V1
 * Éditeur visuel pour modifier les pages de l'application administration
 */

export type EditAction = "modify" | "delete" | "add" | "move" | "rename";

export interface EditOperation {
  id: string;
  action: EditAction;
  elementId?: string;
  elementType?: string;
  changes?: Record<string, any>;
  timestamp: number;
}

let editMode = false;
let selectedElement: HTMLElement | null = null;
const pendingOperations: EditOperation[] = [];
let savedState: string | null = null;

export function enableEditMode(): boolean {
  if (editMode) {
    console.log("Le mode édition est déjà actif");
    return false;
  }
  console.log("Activation du mode édition...");
  editMode = true;
  document.body.classList.add("edit-mode");
  document.body.style.cursor = "crosshair";
  attachEditListeners();
  highlightEditableElements();
  console.log("Mode édition activé, éléments éditables mis en surbrillance");
  return true;
}

export function disableEditMode(): void {
  if (!editMode) return;
  editMode = false;
  document.body.classList.remove("edit-mode");
  document.body.style.cursor = "";
  removeEditListeners();
  clearSelection();
  clearHighlights();
}

export function isEditMode(): boolean {
  return editMode;
}

function attachEditListeners(): void {
  document.addEventListener("click", handleElementClick, true);
  document.addEventListener("keydown", handleKeyDown);
}

function removeEditListeners(): void {
  document.removeEventListener("click", handleElementClick, true);
  document.removeEventListener("keydown", handleKeyDown);
}

function handleElementClick(e: MouseEvent): void {
  if (!editMode) {
    console.log("Mode édition non actif");
    return;
  }
  
  const target = e.target as HTMLElement;
  if (!target) return;
  
  // Ignorer les clics sur le panneau d'édition, la toolbar et les modals
  if (target.closest("#icontrol-editor-panel") || 
      target.closest("#icontrol-editor-toolbar") || 
      target.closest("#icontrol-editor-modal")) {
    return;
  }
  
  // Ne pas empêcher le comportement par défaut pour permettre l'interaction normale
  // mais sélectionner quand même l'élément
  const editable = findEditableElement(target);
  if (editable) {
    e.preventDefault();
    e.stopPropagation();
    selectElement(editable);
    // Déclencher un événement pour mettre à jour le panneau
    window.dispatchEvent(new CustomEvent("icontrol-editor-select"));
    console.log("Élément sélectionné:", editable.tagName, editable.id || editable.className);
  }
}

function findEditableElement(element: HTMLElement): HTMLElement | null {
  let current: HTMLElement | null = element;
  
  while (current && current !== document.body) {
    if (isEditableElement(current)) {
      return current;
    }
    current = current.parentElement;
  }
  
  return null;
}

function isEditableElement(element: HTMLElement): boolean {
  // Ignorer les éléments du panneau d'édition
  if (element.closest("#icontrol-editor-panel")) return false;
  if (element.closest("#icontrol-editor-toolbar")) return false;
  if (element.closest("#icontrol-editor-modal")) return false;
  if (element.closest("#icontrol-editor-main-content") && element.id === "icontrol-editor-main-content") return false;
  
  // Tous les éléments HTML sont éditables par défaut dans le mode édition
  // Sauf les éléments système
  const tag = element.tagName.toLowerCase();
  if (tag === "script" || tag === "style" || tag === "meta" || tag === "link" || tag === "head") {
    return false;
  }
  
  // Si l'élément a un parent body ou un conteneur principal, il est éditable
  // Vérifier que l'élément n'est pas vide et a une présence visuelle
  const hasContent = element.textContent?.trim().length > 0 || 
                     element.innerHTML?.trim().length > 0 ||
                     element.offsetWidth > 0 || 
                     element.offsetHeight > 0 ||
                     element.id || 
                     element.className;
  
  // Accepter presque tous les éléments sauf ceux du panneau d'édition
  return hasContent !== false;
}

function selectElement(element: HTMLElement): void {
  clearSelection();
  selectedElement = element;
  
  // Ajouter bordure pointillée (utiliser CSS pour cohérence)
  element.setAttribute("data-selected", "true");
  
  // Déclencher un événement pour mettre à jour le panneau (dans la fenêtre actuelle)
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("icontrol-editor-select"));
  }
  
  // Afficher la toolbar d'édition (optionnel, car on a le panneau)
  // showEditToolbar(element);
}

function clearSelection(): void {
  if (selectedElement) {
    selectedElement.removeAttribute("data-selected");
  }
  selectedElement = null;
  hideEditToolbar();
}

function highlightEditableElements(): void {
  // Sélectionner plus d'éléments éditables
  const editables = document.querySelectorAll(`
    table, button, input, textarea, select,
    .cxCard, .card, [data-section-id], [data-editable='true'],
    div[id], div[class], span[id], span[class],
    p, h1, h2, h3, h4, h5, h6, label, li, td, th,
    .wrap, .container, [data-section]
  `.replace(/\s+/g, " ").trim());
  
  editables.forEach((el) => {
    const htmlEl = el as HTMLElement;
    // Ignorer les éléments du panneau d'édition
    if (htmlEl.closest("#icontrol-editor-panel")) return;
    
    htmlEl.setAttribute("data-editable-highlight", "true");
    htmlEl.style.transition = "outline 0.2s";
  });
}

function clearHighlights(): void {
  document.querySelectorAll("[data-editable-highlight]").forEach((el) => {
    const htmlEl = el as HTMLElement;
    htmlEl.removeAttribute("data-editable-highlight");
    htmlEl.style.outline = "";
  });
}

function showEditToolbar(element: HTMLElement): void {
  hideEditToolbar();
  
  const toolbar = document.createElement("div");
  toolbar.style.minWidth = "0";
  toolbar.style.boxSizing = "border-box";
  toolbar.id = "icontrol-editor-toolbar";
  toolbar.setAttribute("style", `
    position: fixed;
    top: 80px;
    right: 20px;
    background: #1e1e1e;
    border: 1px solid #3e3e3e;
    border-radius: 8px;
    padding: 12px;
    z-index: 10001;
    min-width: 200px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  `);
  
  const tagName = element.tagName.toLowerCase();
  const elementInfo = document.createElement("div");
  elementInfo.setAttribute("style", "color:#858585;font-size:11px;margin-bottom:12px;font-family:monospace;");
  elementInfo.textContent = `<${tagName}${element.id ? `#${element.id}` : ""}${element.className ? `.${element.className.split(" ")[0]}` : ""}>`;
  toolbar.appendChild(elementInfo);
  
  const actions = [
    { id: "modify", label: "Modifier", icon: "✏️" },
    { id: "rename", label: "Renommer", icon: "🏷️" },
    { id: "add", label: "Ajouter", icon: "➕" },
    { id: "move", label: "Déplacer", icon: "↔️" },
    { id: "delete", label: "Supprimer", icon: "🗑️", danger: true },
  ];
  
  actions.forEach(action => {
    const btn = document.createElement("button");
    btn.setAttribute("style", `
      width: 100%;
      padding: 10px;
      margin-bottom: 8px;
      background: ${action.danger ? "rgba(244,135,113,0.15)" : "#37373d"};
      color: ${action.danger ? "#f48771" : "white"};
      border: 1px solid ${action.danger ? "#f48771" : "#3e3e3e"};
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      display: flex;
      align-items: center;
      gap: 8px;
    `);
    btn.innerHTML = `<span>${action.icon}</span> ${action.label}`;
    btn.onclick = () => handleEditAction(action.id as EditAction, element);
    toolbar.appendChild(btn);
  });
  
  document.body.appendChild(toolbar);
  
  // Positionner la toolbar près de l'élément sélectionné
  const rect = element.getBoundingClientRect();
  toolbar.style.top = `${Math.max(80, rect.top)}px`;
  toolbar.style.left = `${rect.right + 20}px`;
}

function hideEditToolbar(): void {
  const toolbar = document.getElementById("icontrol-editor-toolbar");
  if (toolbar) {
    toolbar.remove();
  }
}

function handleEditAction(action: EditAction, element: HTMLElement): void {
  if (!selectedElement) return;
  
  switch (action) {
    case "modify":
      showModifyDialog(element);
      break;
    case "rename":
      showRenameDialog(element);
      break;
    case "add":
      showAddDialog(element);
      break;
    case "move":
      enableMoveMode(element);
      break;
    case "delete":
      showDeleteConfirm(element);
      break;
  }
}

function showModifyDialog(element: HTMLElement): void {
  const modal = document.createElement("div");
  modal.id = "icontrol-editor-modal";
  modal.setAttribute("style", `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10002;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `);
  
  const tagName = element.tagName.toLowerCase();
  const isTextElement = tagName === "p" || tagName === "span" || tagName === "div" || tagName === "h1" || tagName === "h2" || tagName === "h3";
  const isInput = tagName === "input" || tagName === "textarea";
  const isButton = tagName === "button";
  const isTable = tagName === "table";
  
  let contentHtml = "";
  
  if (isTextElement) {
    contentHtml = `
      <label style="display:block;color:#858585;font-size:12px;margin-bottom:8px;font-weight:600;">Contenu texte</label>
      <textarea id="editContent" style="width:100%;padding:12px;border-radius:8px;border:1px solid #3e3e3e;background:#121212;color:#d4d4d4;font-size:14px;min-height:100px;">${element.textContent || ""}</textarea>
    `;
  } else if (isInput) {
    const input = element as HTMLInputElement;
    contentHtml = `
      <label style="display:block;color:#858585;font-size:12px;margin-bottom:8px;font-weight:600;">Valeur</label>
      <input id="editContent" type="${input.type || "text"}" value="${input.value || ""}" style="width:100%;padding:12px;border-radius:8px;border:1px solid #3e3e3e;background:#121212;color:#d4d4d4;font-size:14px;" />
    `;
  } else if (isButton) {
    contentHtml = `
      <label style="display:block;color:#858585;font-size:12px;margin-bottom:8px;font-weight:600;">Texte du bouton</label>
      <input id="editContent" type="text" value="${element.textContent || ""}" style="width:100%;padding:12px;border-radius:8px;border:1px solid #3e3e3e;background:#121212;color:#d4d4d4;font-size:14px;" />
    `;
  } else if (isTable) {
    contentHtml = `
      <div style="color:#858585;font-size:13px;margin-bottom:16px;">
        Pour modifier un tableau, sélectionnez une cellule individuelle.
      </div>
      <label style="display:block;color:#858585;font-size:12px;margin-bottom:8px;font-weight:600;">Actions disponibles</label>
      <div style="display:grid;gap:8px;">
        <button id="addRow" style="padding:10px;background:#37373d;color:white;border:1px solid #3e3e3e;border-radius:6px;cursor:pointer;">Ajouter une ligne</button>
        <button id="addCol" style="padding:10px;background:#37373d;color:white;border:1px solid #3e3e3e;border-radius:6px;cursor:pointer;">Ajouter une colonne</button>
      </div>
    `;
  } else {
    contentHtml = `
      <label style="display:block;color:#858585;font-size:12px;margin-bottom:8px;font-weight:600;">Style CSS (optionnel)</label>
      <textarea id="editContent" placeholder="Ex: color: red; font-size: 16px;" style="width:100%;padding:12px;border-radius:8px;border:1px solid #3e3e3e;background:#121212;color:#d4d4d4;font-size:14px;min-height:80px;font-family:monospace;"></textarea>
    `;
  }
  
  modal.innerHTML = `
    <div style="background:#1e1e1e;border:1px solid #3e3e3e;border-radius:12px;padding:24px;max-width:500px;width:100%;">
      <div style="font-size:18px;font-weight:700;color:#d4d4d4;margin-bottom:16px;">
        Modifier l'élément
      </div>
      ${contentHtml}
      <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:20px;">
        <button id="cancelEdit" style="padding:10px 20px;background:transparent;color:#858585;border:1px solid #3e3e3e;border-radius:8px;cursor:pointer;font-weight:600;">
          Annuler
        </button>
        <button id="saveEdit" style="padding:10px 20px;background:#37373d;color:white;border:1px solid #3e3e3e;border-radius:8px;cursor:pointer;font-weight:700;">
          Sauvegarder
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const cancelBtn = modal.querySelector("#cancelEdit") as HTMLButtonElement;
  const saveBtn = modal.querySelector("#saveEdit") as HTMLButtonElement;
  
  cancelBtn.onclick = () => document.body.removeChild(modal);
  saveBtn.onclick = () => {
    const editInput = modal.querySelector("#editContent") as HTMLInputElement | HTMLTextAreaElement;
    if (editInput) {
      // Appliquer immédiatement la modification
      if (isTextElement) {
        element.textContent = editInput.value;
      } else if (isInput) {
        (element as HTMLInputElement).value = editInput.value;
      } else if (isButton) {
        element.textContent = editInput.value;
      }
      
      // Enregistrer la modification
      saveModificationToDraft();
      
      const operation: EditOperation = {
        id: `op_${Date.now()}`,
        action: "modify",
        elementId: element.id || `el_${Date.now()}`,
        elementType: tagName,
        changes: {
          content: editInput.value,
          original: isTextElement ? element.textContent : (element as HTMLInputElement).value
        },
        timestamp: Date.now()
      };
      pendingOperations.push(operation);
      updatePendingOperationsDisplay();
    }
    
    // Gestion spéciale pour les tableaux
    const addRowBtn = modal.querySelector("#addRow") as HTMLButtonElement;
    const addColBtn = modal.querySelector("#addCol") as HTMLButtonElement;
    
    if (addRowBtn) {
      addRowBtn.onclick = () => {
        const operation: EditOperation = {
          id: `op_${Date.now()}`,
          action: "add",
          elementId: element.id || `table_${Date.now()}`,
          elementType: "table",
          changes: { type: "row" },
          timestamp: Date.now()
        };
        pendingOperations.push(operation);
        updatePendingOperationsDisplay();
        document.body.removeChild(modal);
      };
    }
    
    if (addColBtn) {
      addColBtn.onclick = () => {
        const operation: EditOperation = {
          id: `op_${Date.now()}`,
          action: "add",
          elementId: element.id || `table_${Date.now()}`,
          elementType: "table",
          changes: { type: "column" },
          timestamp: Date.now()
        };
        pendingOperations.push(operation);
        updatePendingOperationsDisplay();
        document.body.removeChild(modal);
      };
    }
    
    if (!isTable) {
      document.body.removeChild(modal);
    }
  };
  
  modal.onclick = (e) => {
    if (e.target === modal) document.body.removeChild(modal);
  };
}

function showRenameDialog(element: HTMLElement): void {
  const modal = document.createElement("div");
  modal.id = "icontrol-editor-modal";
  modal.setAttribute("style", `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10002;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `);
  
  modal.innerHTML = `
    <div style="background:#1e1e1e;border:1px solid #3e3e3e;border-radius:12px;padding:24px;max-width:400px;width:100%;">
      <div style="font-size:18px;font-weight:700;color:#d4d4d4;margin-bottom:16px;">
        Renommer l'élément
      </div>
      <label style="display:block;color:#858585;font-size:12px;margin-bottom:8px;font-weight:600;">
        Nouveau nom / ID
      </label>
      <input id="renameInput" type="text" value="${element.id || element.textContent?.substring(0, 30) || ""}" style="width:100%;padding:12px;border-radius:8px;border:1px solid #3e3e3e;background:#121212;color:#d4d4d4;font-size:14px;" />
      <div style="display:flex;gap:12px;justify-content:flex-end;margin-top:20px;">
        <button id="cancelRename" style="padding:10px 20px;background:transparent;color:#858585;border:1px solid #3e3e3e;border-radius:8px;cursor:pointer;font-weight:600;">
          Annuler
        </button>
        <button id="saveRename" style="padding:10px 20px;background:#37373d;color:white;border:1px solid #3e3e3e;border-radius:8px;cursor:pointer;font-weight:700;">
          Sauvegarder
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const cancelBtn = modal.querySelector("#cancelRename") as HTMLButtonElement;
  const saveBtn = modal.querySelector("#saveRename") as HTMLButtonElement;
  const input = modal.querySelector("#renameInput") as HTMLInputElement;
  
  cancelBtn.onclick = () => document.body.removeChild(modal);
  saveBtn.onclick = () => {
    const operation: EditOperation = {
      id: `op_${Date.now()}`,
      action: "rename",
      elementId: element.id || `el_${Date.now()}`,
      elementType: element.tagName.toLowerCase(),
      changes: {
        newName: input.value,
        original: element.id || element.textContent || ""
      },
      timestamp: Date.now()
    };
    pendingOperations.push(operation);
    updatePendingOperationsDisplay();
    document.body.removeChild(modal);
  };
  
  modal.onclick = (e) => {
    if (e.target === modal) document.body.removeChild(modal);
  };
}

function showAddDialog(element: HTMLElement): void {
  const modal = document.createElement("div");
  modal.id = "icontrol-editor-modal";
  modal.setAttribute("style", `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 10002;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `);
  
  modal.innerHTML = `
    <div style="background:#1e1e1e;border:1px solid #3e3e3e;border-radius:12px;padding:24px;max-width:500px;width:100%;">
      <div style="font-size:18px;font-weight:700;color:#d4d4d4;margin-bottom:16px;">
        Ajouter un élément
      </div>
      <label style="display:block;color:#858585;font-size:12px;margin-bottom:8px;font-weight:600;">
        Type d'élément
      </label>
      <select id="elementType" style="width:100%;padding:12px;border-radius:8px;border:1px solid #3e3e3e;background:#121212;color:#d4d4d4;font-size:14px;margin-bottom:16px;">
        <option value="button">Bouton</option>
        <option value="text">Zone de texte</option>
        <option value="input">Champ de saisie</option>
        <option value="table">Tableau</option>
        <option value="card">Carte</option>
        <option value="section">Section</option>
      </select>
      <label style="display:block;color:#858585;font-size:12px;margin-bottom:8px;font-weight:600;">
        Contenu / Label
      </label>
      <input id="elementContent" type="text" placeholder="Texte à afficher" style="width:100%;padding:12px;border-radius:8px;border:1px solid #3e3e3e;background:#121212;color:#d4d4d4;font-size:14px;margin-bottom:16px;" />
      <div style="display:flex;gap:12px;justify-content:flex-end;">
        <button id="cancelAdd" style="padding:10px 20px;background:transparent;color:#858585;border:1px solid #3e3e3e;border-radius:8px;cursor:pointer;font-weight:600;">
          Annuler
        </button>
        <button id="saveAdd" style="padding:10px 20px;background:#37373d;color:white;border:1px solid #3e3e3e;border-radius:8px;cursor:pointer;font-weight:700;">
          Sauvegarder
        </button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  
  const cancelBtn = modal.querySelector("#cancelAdd") as HTMLButtonElement;
  const saveBtn = modal.querySelector("#saveAdd") as HTMLButtonElement;
  const typeSelect = modal.querySelector("#elementType") as HTMLSelectElement;
  const contentInput = modal.querySelector("#elementContent") as HTMLInputElement;
  
  cancelBtn.onclick = () => document.body.removeChild(modal);
  saveBtn.onclick = () => {
    // Créer et ajouter immédiatement l'élément
    const newElement = createElementFromType(typeSelect.value, contentInput.value);
    element.appendChild(newElement);
    
    // Enregistrer la modification
    saveModificationToDraft();
    
    const operation: EditOperation = {
      id: `op_${Date.now()}`,
      action: "add",
      elementId: element.id || `parent_${Date.now()}`,
      elementType: typeSelect.value,
      changes: {
        content: contentInput.value,
        parentId: element.id || ""
      },
      timestamp: Date.now()
    };
    pendingOperations.push(operation);
    updatePendingOperationsDisplay();
    document.body.removeChild(modal);
  };
  
  modal.onclick = (e) => {
    if (e.target === modal) document.body.removeChild(modal);
  };
}

function enableMoveMode(element: HTMLElement): void {
  // Mode déplacement activé
  const indicator = document.createElement("div");
  indicator.id = "icontrol-move-indicator";
  indicator.setAttribute("style", `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(220,220,170,0.9);
    color: #1e1e1e;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 10003;
    font-weight: 600;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
  `);
  indicator.textContent = "Mode déplacement actif - Cliquez sur la destination";
  document.body.appendChild(indicator);
  
  const moveHandler = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target === element || target.closest("#icontrol-editor-toolbar") || target.closest("#icontrol-editor-modal")) {
      return;
    }
    
    const destination = findEditableElement(target);
    if (destination && destination !== element) {
      const operation: EditOperation = {
        id: `op_${Date.now()}`,
        action: "move",
        elementId: element.id || `el_${Date.now()}`,
        elementType: element.tagName.toLowerCase(),
        changes: {
          destinationId: destination.id || "",
          destinationType: destination.tagName.toLowerCase()
        },
        timestamp: Date.now()
      };
      pendingOperations.push(operation);
      updatePendingOperationsDisplay();
      
      document.body.removeChild(indicator);
      document.removeEventListener("click", moveHandler, true);
    }
  };
  
  document.addEventListener("click", moveHandler, true);
  
  // Annuler après 10 secondes
  setTimeout(() => {
    if (document.getElementById("icontrol-move-indicator")) {
      document.body.removeChild(indicator);
      document.removeEventListener("click", moveHandler, true);
    }
  }, 10000);
}

function showDeleteConfirm(element: HTMLElement): void {
  if (!confirm(`Voulez-vous vraiment supprimer cet élément ?\n\nType: ${element.tagName}\nID: ${element.id || "Aucun"}`)) {
    return;
  }
  
  const operation: EditOperation = {
    id: `op_${Date.now()}`,
    action: "delete",
    elementId: element.id || `el_${Date.now()}`,
    elementType: element.tagName.toLowerCase(),
    changes: {
      content: element.outerHTML.substring(0, 200)
    },
    timestamp: Date.now()
  };
  pendingOperations.push(operation);
  updatePendingOperationsDisplay();
}

function updatePendingOperationsDisplay(): void {
  let display = document.getElementById("icontrol-pending-operations");
  if (!display) {
    display = document.createElement("div");
    display.id = "icontrol-pending-operations";
    display.setAttribute("style", `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #1e1e1e;
      border: 1px solid #3e3e3e;
      border-radius: 8px;
      padding: 16px;
      z-index: 10001;
      max-width: 400px;
      max-height: 400px;
      overflow-y: auto;
      box-shadow: 0 8px 24px rgba(0,0,0,0.5);
    `);
    document.body.appendChild(display);
  }
  
  if (pendingOperations.length === 0) {
    display.innerHTML = `
      <div style="color:#858585;font-size:13px;text-align:center;padding:20px;">
        Aucune modification en attente
      </div>
    `;
    return;
  }
  
  display.innerHTML = `
    <div style="font-weight:600;color:#d4d4d4;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center;">
      <span>Modifications en attente (${pendingOperations.length})</span>
      <button id="clearAllOps" style="padding:4px 8px;background:rgba(244,135,113,0.15);color:#f48771;border:1px solid #f48771;border-radius:4px;cursor:pointer;font-size:11px;">
        Tout effacer
      </button>
    </div>
    <div style="display:grid;gap:8px;margin-bottom:16px;">
      ${pendingOperations.map((op, idx) => `
        <div style="padding:10px;background:rgba(255,255,255,0.02);border-radius:6px;font-size:12px;">
          <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:4px;">
            <span style="color:#4ec9b0;font-weight:600;">${op.action.toUpperCase()}</span>
            <button onclick="window.__removeOp?.(${idx})" style="padding:2px 6px;background:transparent;color:#f48771;border:none;cursor:pointer;font-size:14px;">×</button>
          </div>
          <div style="color:#858585;font-size:11px;">
            ${op.elementType} ${op.elementId ? `#${op.elementId}` : ""}
          </div>
        </div>
      `).join("")}
    </div>
    <div style="display:flex;gap:8px;">
      <button id="saveOps" style="flex:1;padding:10px;background:#37373d;color:white;border:1px solid #3e3e3e;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">
        Sauvegarder
      </button>
      <button id="applyOps" style="flex:1;padding:10px;background:#4ec9b0;color:#1e1e1e;border:1px solid #4ec9b0;border-radius:6px;cursor:pointer;font-weight:700;font-size:13px;">
        Appliquer
      </button>
    </div>
  `;
  
  const clearBtn = display.querySelector("#clearAllOps") as HTMLButtonElement;
  const saveBtn = display.querySelector("#saveOps") as HTMLButtonElement;
  const applyBtn = display.querySelector("#applyOps") as HTMLButtonElement;
  
  clearBtn.onclick = () => {
    pendingOperations.length = 0;
    updatePendingOperationsDisplay();
  };
  
  saveBtn.onclick = () => {
    savedState = JSON.stringify(pendingOperations);
    localStorage.setItem("icontrol_pending_edits", savedState);
    const toast = document.createElement("div");
    toast.setAttribute("style", `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 20px;
      background: rgba(78,201,176,0.15);
      border: 1px solid #4ec9b0;
      border-left: 4px solid #4ec9b0;
      border-radius: 8px;
      color: #4ec9b0;
      font-weight: 600;
      z-index: 10004;
    `);
    toast.textContent = `✅ ${pendingOperations.length} modification(s) sauvegardée(s)`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };
  
  applyBtn.onclick = () => {
    if (pendingOperations.length === 0) return;
    
    if (!confirm(`Voulez-vous appliquer ${pendingOperations.length} modification(s) ?\n\nCette action est irréversible.`)) {
      return;
    }
    
    applyOperations();
    pendingOperations.length = 0;
    updatePendingOperationsDisplay();
    
    const toast = document.createElement("div");
    toast.setAttribute("style", `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 16px 20px;
      background: rgba(78,201,176,0.15);
      border: 1px solid #4ec9b0;
      border-left: 4px solid #4ec9b0;
      border-radius: 8px;
      color: #4ec9b0;
      font-weight: 600;
      z-index: 10004;
    `);
    toast.textContent = `✅ Modifications appliquées avec succès`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };
  
  (window as any).__removeOp = (index: number) => {
    pendingOperations.splice(index, 1);
    updatePendingOperationsDisplay();
  };
}

function applyOperations(): void {
  pendingOperations.forEach(op => {
    try {
      const element = document.getElementById(op.elementId || "") || 
                     document.querySelector(`[data-element-id="${op.elementId}"]`) as HTMLElement;
      
      if (!element) return;
      
      switch (op.action) {
        case "modify":
          if (op.changes?.content !== undefined) {
            const tagName = element.tagName.toLowerCase();
            if (tagName === "input" || tagName === "textarea") {
              (element as HTMLInputElement).value = op.changes.content;
            } else {
              element.textContent = op.changes.content;
            }
          }
          break;
        case "rename":
          if (op.changes?.newName) {
            element.id = op.changes.newName;
            if (element.textContent && !element.id) {
              element.textContent = op.changes.newName;
            }
          }
          break;
        case "add":
          const newEl = createElementFromType(op.elementType || "div", op.changes?.content || "");
          if (element) {
            element.appendChild(newEl);
          }
          break;
        case "move":
          if (op.changes?.destinationId) {
            const dest = document.getElementById(op.changes.destinationId);
            if (dest && element.parentElement) {
              dest.appendChild(element);
            }
          }
          break;
        case "delete":
          if (element.parentElement) {
            element.parentElement.removeChild(element);
          }
          break;
      }
    } catch (e) {
      console.error("Erreur lors de l'application de l'opération:", e);
    }
  });
}

function createElementFromType(type: string, content: string): HTMLElement {
  let element: HTMLElement;
  
  switch (type) {
    case "button":
      element = document.createElement("button");
      element.textContent = content;
      element.setAttribute("style", "padding:10px 16px;border-radius:8px;border:1px solid #3e3e3e;background:#37373d;color:white;cursor:pointer;");
      break;
    case "text":
      element = document.createElement("div");
      element.textContent = content;
      element.setAttribute("style", "padding:12px;color:#d4d4d4;");
      break;
    case "input":
      element = document.createElement("input");
      (element as HTMLInputElement).value = content;
      element.setAttribute("style", "padding:10px;border-radius:8px;border:1px solid #3e3e3e;background:#121212;color:#d4d4d4;");
      break;
    case "table":
      element = document.createElement("table");
      element.setAttribute("style", "width:100%;border-collapse:collapse;");
      const row = document.createElement("tr");
      const cell = document.createElement("td");
      cell.textContent = content || "Nouvelle cellule";
      row.appendChild(cell);
      element.appendChild(row);
      break;
    case "card":
      element = document.createElement("div");
      element.className = "cxCard";
      element.setAttribute("style", "padding:20px;border:1px solid #3e3e3e;border-radius:12px;background:rgba(255,255,255,0.02);");
      element.textContent = content;
      break;
    case "section":
      element = document.createElement("section");
      element.setAttribute("data-section-id", `section_${Date.now()}`);
      element.setAttribute("style", "padding:20px;border:1px solid #3e3e3e;border-radius:12px;margin:16px 0;");
      element.textContent = content;
      break;
    default:
      element = document.createElement("div");
      element.textContent = content;
  }
  
  return element;
}

function handleKeyDown(e: KeyboardEvent): void {
  if (!editMode) return;
  
  if (e.key === "Escape") {
    disableEditMode();
  } else if (e.key === "Delete" && selectedElement) {
    showDeleteConfirm(selectedElement);
  } else if (selectedElement && (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight")) {
    // Déplacer l'élément sélectionné avec les flèches du clavier
    e.preventDefault();
    moveElementWithArrows(selectedElement, e.key, e.shiftKey);
  }
}

function moveElementWithArrows(element: HTMLElement, direction: string, fast: boolean = false): void {
  const step = fast ? 10 : 1; // Déplacement rapide avec Shift
  const currentPosition = element.style.position;
  
  // Si l'élément n'a pas de position absolue/relative, la définir
  if (!currentPosition || currentPosition === "static") {
    const rect = element.getBoundingClientRect();
    const parentRect = element.parentElement?.getBoundingClientRect();
    if (parentRect) {
      element.style.position = "absolute";
      element.style.top = `${rect.top - parentRect.top}px`;
      element.style.left = `${rect.left - parentRect.left}px`;
    } else {
      element.style.position = "relative";
    }
  }
  
  let newTop = parseInt(element.style.top || "0", 10);
  let newLeft = parseInt(element.style.left || "0", 10);
  
  switch (direction) {
    case "ArrowUp":
      newTop -= step;
      break;
    case "ArrowDown":
      newTop += step;
      break;
    case "ArrowLeft":
      newLeft -= step;
      break;
    case "ArrowRight":
      newLeft += step;
      break;
  }
  
  element.style.top = `${newTop}px`;
  element.style.left = `${newLeft}px`;
  
  // Enregistrer la modification
  saveModificationToDraft();
}

// Fonction pour sauvegarder les modifications en draft
function saveModificationToDraft(): void {
  const pageId = getCurrentHash() || window.location.pathname;
  const pageName = document.title || "Page inconnue";
  
  // Collecter toutes les modifications actuelles de la page
  const modifications: Record<string, any> = {};
  document.querySelectorAll("[data-selected], [style*='position'], [style*='top'], [style*='left']").forEach((el) => {
    const htmlEl = el as HTMLElement;
    if (htmlEl.id || htmlEl.className) {
      modifications[htmlEl.id || htmlEl.className] = {
        id: htmlEl.id,
        className: htmlEl.className,
        style: htmlEl.style.cssText,
        innerHTML: htmlEl.innerHTML,
        tagName: htmlEl.tagName.toLowerCase()
      };
    }
  });
  
  // Sauvegarder via pageModificationManager
  import("../pageEditor/pageModificationManager").then(({ saveDraftModification }) => {
    saveDraftModification({
      id: `mod_${Date.now()}`,
      pageId,
      pageName,
      modifications,
      status: "draft",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: "1.0"
    });
  }).catch(() => {
    // Fallback: sauvegarder dans localStorage directement
    try {
      const key = `icontrol_draft_${pageId}`;
      localStorage.setItem(key, JSON.stringify({
        pageId,
        pageName,
        modifications,
        timestamp: Date.now()
      }));
    } catch (e) {
      console.error("Erreur lors de la sauvegarde:", e);
    }
  });
}

// Fonction pour ouvrir la fenêtre Toolbox
export function openToolboxWindow(): void {
  import("./toolboxWindow").then(module => {
    module.openToolboxWindow();
  });
}

export function getPendingOperations(): EditOperation[] {
  return [...pendingOperations];
}

export function clearPendingOperations(): void {
  pendingOperations.length = 0;
  updatePendingOperationsDisplay();
}

export function getSelectedElement(): HTMLElement | null {
  return selectedElement;
}

export function updateSelectedElement(changes: { id?: string; className?: string; style?: Record<string, string> }): void {
  if (!selectedElement) return;
  
  if (changes.id) {
    selectedElement.id = changes.id;
  }
  if (changes.className) {
    selectedElement.className = changes.className;
  }
  if (changes.style) {
    Object.assign(selectedElement.style, changes.style);
  }
  
  // Déclencher un événement pour mettre à jour le panneau
  window.dispatchEvent(new CustomEvent("icontrol-editor-select"));
}

export function deleteSelectedElement(): void {
  if (!selectedElement) return;
  
  const parent = selectedElement.parentElement;
  if (parent) {
    parent.removeChild(selectedElement);
    clearSelection();
    window.dispatchEvent(new CustomEvent("icontrol-editor-select"));
  }
}

export function loadSavedOperations(): EditOperation[] {
  try {
    const saved = localStorage.getItem("icontrol_pending_edits");
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }
  return [];
}
