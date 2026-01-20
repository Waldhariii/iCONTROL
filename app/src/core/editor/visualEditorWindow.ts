/**
 * ICONTROL_VISUAL_EDITOR_WINDOW_V1
 * Fenêtre d'édition visuelle avec panneau d'outils (comme l'image)
 */

import type { PageInfo } from "./pageSelector";

// Ces fonctions seront chargées dynamiquement dans la fenêtre popup
declare global {
  interface Window {
    icontrolEditor?: {
      enableEditMode: () => boolean;
      disableEditMode: () => void;
      getSelectedElement: () => HTMLElement | null;
      updateSelectedElement: (changes: { id?: string; className?: string; style?: Record<string, string> }) => void;
      deleteSelectedElement: () => void;
      isEditMode: () => boolean;
    };
  }
}

const LS_KEY_EDITOR_WINDOW_SIZE = "icontrol_editor_window_size";
const LS_KEY_EDITOR_PANEL_WIDTH = "icontrol_editor_panel_width";

/**
 * Initialise les fonctions de l'éditeur directement dans la popup (version autonome)
 * Cela évite les problèmes d'import ES6 dans les popups
 */
function initializeEditorFunctionsInPopup(doc: Document, popup: Window): void {
  let editMode = false;
  let selectedElement: HTMLElement | null = null;
  
  // Système Undo/Redo
  type HistoryState = {
    action: string;
    element: HTMLElement | null;
    elementId: string | null;
    previousState: any;
    timestamp: number;
  };
  
  const undoStack: HistoryState[] = [];
  const redoStack: HistoryState[] = [];
  const MAX_HISTORY = 50;
  
  const saveState = (action: string, element: HTMLElement | null, getState: () => any): void => {
    const state: HistoryState = {
      action,
      element: element ? element.cloneNode(true) as HTMLElement : null,
      elementId: element?.id || null,
      previousState: getState(),
      timestamp: Date.now()
    };
    
    undoStack.push(state);
    if (undoStack.length > MAX_HISTORY) {
      undoStack.shift();
    }
    redoStack.length = 0; // Vider redo quand nouvelle action
  };
  
  const undo = (): boolean => {
    if (undoStack.length === 0) return false;
    const state = undoStack.pop()!;
    
    if (state.elementId && state.previousState) {
      const element = doc.getElementById(state.elementId);
      if (element && state.previousState.outerHTML) {
        const temp = doc.createElement("div");
        temp.innerHTML = state.previousState.outerHTML;
        const restored = temp.firstElementChild as HTMLElement;
        if (restored && element.parentElement) {
          element.parentElement.replaceChild(restored, element);
        }
      }
    }
    
    redoStack.push(state);
    popup.dispatchEvent(new CustomEvent("icontrol-editor-select"));
    return true;
  };
  
  const redo = (): boolean => {
    if (redoStack.length === 0) return false;
    const state = redoStack.pop()!;
    
    if (state.element && state.elementId) {
      const currentElement = doc.getElementById(state.elementId);
      if (currentElement && currentElement.parentElement) {
        const cloned = state.element.cloneNode(true) as HTMLElement;
        currentElement.parentElement.replaceChild(cloned, currentElement);
      }
    }
    
    undoStack.push(state);
    popup.dispatchEvent(new CustomEvent("icontrol-editor-select"));
    return true;
  };

  // Empêcher la navigation quand le mode édition est actif
  const blockNavigation = (e: Event) => {
    if (editMode) {
      e.preventDefault();
      e.stopPropagation();
      popup.alert("Le mode édition est actif. Veuillez désactiver le mode édition avant de changer de page.");
      return false;
    }
  };
  
  const blockBeforeUnload = (e: BeforeUnloadEvent) => {
    if (editMode) {
      e.preventDefault();
      e.returnValue = "Le mode édition est actif. Les modifications non sauvegardées seront perdues.";
      return e.returnValue;
    }
  };

  // Fonction pour activer le mode édition
  const enableEditMode = (): boolean => {
    if (editMode) return false;
    editMode = true;
    doc.body.classList.add("edit-mode");
    doc.body.style.cursor = "crosshair";
    
    // Attacher les listeners
    doc.addEventListener("click", handleElementClick, true);
    doc.addEventListener("dblclick", handleDblClick, true);
    doc.addEventListener("keydown", handleKeyDown);
    doc.addEventListener("mousedown", handleMouseDown, true);
    doc.addEventListener("mousemove", handleMouseMove);
    doc.addEventListener("mouseup", handleMouseUp);
    doc.addEventListener("contextmenu", handleContextMenu, true);
    popup.addEventListener("hashchange", blockNavigation);
    popup.addEventListener("beforeunload", blockBeforeUnload);
    
    // Mettre en surbrillance les éléments éditables
    const editables = doc.querySelectorAll("div, p, span, h1, h2, h3, h4, h5, h6, button, input, textarea, table, section, article");
    editables.forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (!htmlEl.closest("#icontrol-editor-panel")) {
        htmlEl.setAttribute("data-editable-highlight", "true");
      }
    });
    
    console.log("Mode édition activé dans la popup");
    return true;
  };

  // Fonction pour désactiver le mode édition
  const disableEditMode = (): void => {
    if (!editMode) return;
    editMode = false;
    doc.body.classList.remove("edit-mode");
    doc.body.style.cursor = "";
    doc.removeEventListener("click", handleElementClick, true);
    doc.removeEventListener("dblclick", handleDblClick, true);
    doc.removeEventListener("keydown", handleKeyDown);
    doc.removeEventListener("mousedown", handleMouseDown, true);
    doc.removeEventListener("mousemove", handleMouseMove);
    doc.removeEventListener("mouseup", handleMouseUp);
    doc.removeEventListener("contextmenu", handleContextMenu, true);
    popup.removeEventListener("hashchange", blockNavigation);
    popup.removeEventListener("beforeunload", blockBeforeUnload);
    
    // Nettoyer les surbrillances
    doc.querySelectorAll("[data-editable-highlight]").forEach((el) => {
      const htmlEl = el as HTMLElement;
      htmlEl.removeAttribute("data-editable-highlight");
    });
    
    // Nettoyer la sélection
    doc.querySelectorAll("[data-selected]").forEach((el) => {
      el.removeAttribute("data-selected");
    });
    selectedElement = null;
  };

  // Gestionnaire de double-clic pour édition inline
  let doubleClickTimer: number | null = null;
  const handleDblClick = (e: MouseEvent): void => {
    if (!editMode) return;
    const target = e.target as HTMLElement;
    if (!target || target.closest("#icontrol-editor-panel")) return;
    
    const isTextElement = /^(h[1-6]|p|span|div|label|td|th|li|a|button|strong|em|b|i|textarea)$/i.test(target.tagName);
    if (!isTextElement || target.children.length > 0) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const originalText = target.textContent || "";
    const isLongText = originalText.length > 50 || target.tagName.toLowerCase() === "textarea";
    const editor = isLongText ? doc.createElement("textarea") : doc.createElement("input");
    
    if (editor instanceof HTMLInputElement) {
      editor.type = "text";
    }
    
    const rect = target.getBoundingClientRect();
    const styles = popup.getComputedStyle(target);
    
    editor.value = originalText;
    editor.style.cssText = `
      position: absolute;
      left: ${rect.left}px;
      top: ${rect.top}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
      padding: ${styles.padding};
      margin: ${styles.margin};
      font-family: ${styles.fontFamily};
      font-size: ${styles.fontSize};
      font-weight: ${styles.fontWeight};
      color: ${styles.color};
      background: ${styles.backgroundColor || "#fff"};
      border: 2px solid #007AFF;
      border-radius: 4px;
      z-index: 100000;
      box-sizing: border-box;
    `;
    
    const finish = (save: boolean) => {
      if (save && editor.value !== originalText) {
        target.textContent = editor.value;
        popup.dispatchEvent(new CustomEvent("icontrol-editor-select"));
      }
      doc.body.removeChild(editor);
      target.style.opacity = "1";
    };
    
    editor.onblur = () => finish(true);
    editor.onkeydown = (ke) => {
      if (ke.key === "Enter" && !ke.shiftKey && !(editor instanceof HTMLTextAreaElement)) {
        ke.preventDefault();
        finish(true);
      } else if (ke.key === "Escape") {
        ke.preventDefault();
        finish(false);
      }
    };
    
    target.style.opacity = "0.5";
    doc.body.appendChild(editor);
    editor.focus();
    editor.select();
  };

  // Handler pour les clics sur les éléments
  const handleElementClick = (e: MouseEvent): void => {
    if (!editMode) return;
    const target = e.target as HTMLElement;
    if (!target || target.closest("#icontrol-editor-panel")) return;
    
    // Gérer le double-clic avec un timer (300ms)
    if (doubleClickTimer) {
      clearTimeout(doubleClickTimer);
      doubleClickTimer = null;
      handleDblClick(e);
      return;
    }
    
    doubleClickTimer = window.setTimeout(() => {
      doubleClickTimer = null;
      e.preventDefault();
      e.stopPropagation();
      
      // Sélectionner l'élément (multi-sélection avec Ctrl)
      const addToSelection = (e.ctrlKey || e.metaKey);
      
      if (!addToSelection) {
        doc.querySelectorAll("[data-selected]").forEach((el) => el.removeAttribute("data-selected"));
        selectedElement = target;
      } else {
        // Multi-sélection avec Ctrl
        if (target.hasAttribute("data-selected")) {
          target.removeAttribute("data-selected");
        } else {
          target.setAttribute("data-selected", "true");
          selectedElement = target;
        }
      }
      
      target.setAttribute("data-selected", "true");
      
      // Créer les handles de redimensionnement
      createResizeHandles(target);
      
      // Déclencher un événement pour mettre à jour le panneau
      popup.dispatchEvent(new CustomEvent("icontrol-editor-select"));
    }, 300);
  };

  // Gestionnaire de presse-papiers pour copier/coller
  let clipboard: HTMLElement | null = null;
  
  // Handler pour les touches du clavier
  const handleKeyDown = (e: KeyboardEvent): void => {
    if (!editMode) return;
    
    // Raccourcis clavier
    if (e.ctrlKey || e.metaKey) {
      if (e.key === "z" && !e.shiftKey) {
        // Undo
        e.preventDefault();
        undo();
        return;
      } else if ((e.key === "y" || (e.key === "z" && e.shiftKey))) {
        // Redo
        e.preventDefault();
        redo();
        return;
      } else if (e.key === "c" && selectedElement) {
        // Copier
        e.preventDefault();
        clipboard = selectedElement.cloneNode(true) as HTMLElement;
        if (clipboard.id) clipboard.id = clipboard.id + "_copy";
        clipboard.removeAttribute("data-selected");
        clipboard.removeAttribute("data-editable-highlight");
        return;
      } else if (e.key === "v" && clipboard && selectedElement && selectedElement.parentElement) {
        // Coller
        e.preventDefault();
        const cloned = clipboard.cloneNode(true) as HTMLElement;
        if (cloned.id) cloned.id = cloned.id + "_" + Date.now();
        const index = Array.from(selectedElement.parentElement.children).indexOf(selectedElement);
        if (index >= 0) {
          selectedElement.parentElement.insertBefore(cloned, selectedElement.nextSibling);
        } else {
          selectedElement.parentElement.appendChild(cloned);
        }
        popup.dispatchEvent(new CustomEvent("icontrol-editor-select"));
        return;
      } else if (e.key === "x" && selectedElement) {
        // Couper
        e.preventDefault();
        clipboard = selectedElement.cloneNode(true) as HTMLElement;
        if (clipboard.id) clipboard.id = clipboard.id + "_copy";
        clipboard.removeAttribute("data-selected");
        clipboard.removeAttribute("data-editable-highlight");
        if (selectedElement.parentElement) {
          selectedElement.parentElement.removeChild(selectedElement);
          selectedElement = null;
          popup.dispatchEvent(new CustomEvent("icontrol-editor-select"));
        }
        return;
      } else if (e.key === "d" && selectedElement && selectedElement.parentElement) {
        // Dupliquer
        e.preventDefault();
        const cloned = selectedElement.cloneNode(true) as HTMLElement;
        if (cloned.id) cloned.id = cloned.id + "_copy_" + Date.now();
        cloned.removeAttribute("data-selected");
        const index = Array.from(selectedElement.parentElement.children).indexOf(selectedElement);
        if (index >= 0) {
          selectedElement.parentElement.insertBefore(cloned, selectedElement.nextSibling);
        } else {
          selectedElement.parentElement.appendChild(cloned);
        }
        popup.dispatchEvent(new CustomEvent("icontrol-editor-select"));
        return;
      } else if (e.key === "a") {
        // Sélectionner tout
        e.preventDefault();
        doc.querySelectorAll("[data-editable-highlight]").forEach((el) => {
          el.setAttribute("data-selected", "true");
        });
        popup.dispatchEvent(new CustomEvent("icontrol-editor-select"));
        return;
      } else if (e.key === "s") {
        // Sauvegarder (publication rapide)
        e.preventDefault();
        const publishBtn = doc.querySelector("#icontrol-publish-btn") as HTMLButtonElement;
        if (publishBtn) publishBtn.click();
        return;
      }
    }
    
    // Touches de suppression
    if (e.key === "Delete" || e.key === "Backspace") {
      if (selectedElement && selectedElement.parentElement && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        // Sauvegarder l'état pour undo
        saveState("delete", selectedElement, () => ({ action: "delete", elementId: selectedElement!.id, outerHTML: selectedElement!.outerHTML }));
        selectedElement.parentElement.removeChild(selectedElement);
        selectedElement = null;
        doc.querySelectorAll(".resize-handle").forEach(h => h.remove());
        popup.dispatchEvent(new CustomEvent("icontrol-editor-select"));
        return;
      }
    }
    
    if (e.key === "Escape") {
      disableEditMode();
    } else if (selectedElement && (e.key === "ArrowUp" || e.key === "ArrowDown" || e.key === "ArrowLeft" || e.key === "ArrowRight")) {
      e.preventDefault();
      const step = e.shiftKey ? 10 : 1;
      const currentTop = parseInt(selectedElement.style.top || "0", 10);
      const currentLeft = parseInt(selectedElement.style.left || "0", 10);
      
      if (!selectedElement.style.position || selectedElement.style.position === "static") {
        selectedElement.style.position = "relative";
      }
      
      let newTop = currentTop;
      let newLeft = currentLeft;
      
      switch (e.key) {
        case "ArrowUp": newTop -= step; break;
        case "ArrowDown": newTop += step; break;
        case "ArrowLeft": newLeft -= step; break;
        case "ArrowRight": newLeft += step; break;
      }
      
      // Sauvegarder l'état pour undo avant le déplacement
      if (!selectedElement.hasAttribute("data-move-saved")) {
        saveState("move", selectedElement, () => ({
          action: "move",
          elementId: selectedElement.id,
          top: selectedElement.style.top,
          left: selectedElement.style.left
        }));
        selectedElement.setAttribute("data-move-saved", "true");
        setTimeout(() => selectedElement?.removeAttribute("data-move-saved"), 100);
      }
      
      selectedElement.style.top = `${newTop}px`;
      selectedElement.style.left = `${newLeft}px`;
    }
  };
  
  // Système de redimensionnement avec handles
  let isResizing = false;
  let resizeHandle: string | null = null;
  let resizeStartX = 0;
  let resizeStartY = 0;
  let resizeStartWidth = 0;
  let resizeStartHeight = 0;
  let resizeElement: HTMLElement | null = null;
  
  const createResizeHandles = (element: HTMLElement): void => {
    // Supprimer les handles existants
    doc.querySelectorAll(".resize-handle").forEach(h => h.remove());
    
    if (!element || element.closest("#icontrol-editor-panel")) return;
    
    const rect = element.getBoundingClientRect();
    const handles = [
      { pos: "nw", x: 0, y: 0, cursor: "nw-resize" },
      { pos: "ne", x: rect.width, y: 0, cursor: "ne-resize" },
      { pos: "sw", x: 0, y: rect.height, cursor: "sw-resize" },
      { pos: "se", x: rect.width, y: rect.height, cursor: "se-resize" },
      { pos: "n", x: rect.width / 2, y: 0, cursor: "n-resize" },
      { pos: "s", x: rect.width / 2, y: rect.height, cursor: "s-resize" },
      { pos: "w", x: 0, y: rect.height / 2, cursor: "w-resize" },
      { pos: "e", x: rect.width, y: rect.height / 2, cursor: "e-resize" }
    ];
    
    handles.forEach(handle => {
      const handleEl = doc.createElement("div");
      handleEl.className = "resize-handle";
      handleEl.setAttribute("data-handle", handle.pos);
      handleEl.style.cssText = `
        position: absolute;
        left: ${rect.left + handle.x - 4}px;
        top: ${rect.top + handle.y - 4}px;
        width: 8px;
        height: 8px;
        background: #007AFF;
        border: 2px solid white;
        border-radius: 50%;
        cursor: ${handle.cursor};
        z-index: 100001;
        pointer-events: all;
      `;
      
      handleEl.addEventListener("mousedown", (e) => {
        e.preventDefault();
        e.stopPropagation();
        isResizing = true;
        resizeHandle = handle.pos;
        resizeElement = element;
        resizeStartX = e.clientX;
        resizeStartY = e.clientY;
        resizeStartWidth = rect.width;
        resizeStartHeight = rect.height;
        
        // Sauvegarder l'état pour undo
        saveState("resize", element, () => ({
          action: "resize",
          elementId: element.id,
          width: element.style.width || `${rect.width}px`,
          height: element.style.height || `${rect.height}px`
        }));
      });
      
      doc.body.appendChild(handleEl);
    });
  };
  
  const handleResizeMove = (e: MouseEvent): void => {
    if (!isResizing || !resizeElement || !resizeHandle) return;
    
    const deltaX = e.clientX - resizeStartX;
    const deltaY = e.clientY - resizeStartY;
    
    let newWidth = resizeStartWidth;
    let newHeight = resizeStartHeight;
    
    if (resizeHandle.includes("e")) newWidth = resizeStartWidth + deltaX;
    if (resizeHandle.includes("w")) newWidth = resizeStartWidth - deltaX;
    if (resizeHandle.includes("s")) newHeight = resizeStartHeight + deltaY;
    if (resizeHandle.includes("n")) newHeight = resizeStartHeight - deltaY;
    
    if (newWidth > 20) resizeElement.style.width = `${newWidth}px`;
    if (newHeight > 20) resizeElement.style.height = `${newHeight}px`;
    
    // Repositionner si nécessaire
    if (resizeHandle.includes("w")) {
      const currentLeft = parseInt(resizeElement.style.left || "0", 10);
      resizeElement.style.left = `${currentLeft + deltaX}px`;
    }
    if (resizeHandle.includes("n")) {
      const currentTop = parseInt(resizeElement.style.top || "0", 10);
      resizeElement.style.top = `${currentTop + deltaY}px`;
    }
    
    // Mettre à jour les handles
    createResizeHandles(resizeElement);
  };
  
  const handleResizeUp = (): void => {
    if (isResizing) {
      isResizing = false;
      resizeHandle = null;
      resizeElement = null;
      doc.querySelectorAll(".resize-handle").forEach(h => h.remove());
      if (selectedElement) createResizeHandles(selectedElement);
    }
  };
  
  // Ajouter les listeners de redimensionnement
  doc.addEventListener("mousemove", handleResizeMove);
  doc.addEventListener("mouseup", handleResizeUp);

  // Gestion du Drag & Drop
  let isDragging = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let dragElement: HTMLElement | null = null;
  let dragPlaceholder: HTMLElement | null = null;

  const handleMouseDown = (e: MouseEvent): void => {
    if (!editMode) return;
    const target = e.target as HTMLElement;
    if (!target || target.closest("#icontrol-editor-panel")) return;
    if (!target.hasAttribute("data-selected")) return;

    isDragging = true;
    dragElement = target;
    dragStartX = e.clientX;
    dragStartY = e.clientY;

    dragElement.style.opacity = "0.5";
    dragElement.style.cursor = "grabbing";

    // Créer un placeholder visuel
    dragPlaceholder = doc.createElement("div");
    dragPlaceholder.style.cssText = `
      position: absolute;
      width: ${dragElement.offsetWidth}px;
      height: ${dragElement.offsetHeight}px;
      border: 2px dashed #007AFF;
      background: rgba(0, 122, 255, 0.1);
      pointer-events: none;
      z-index: 9998;
    `;
    doc.body.appendChild(dragPlaceholder);

    e.preventDefault();
  };

  const handleMouseMove = (e: MouseEvent): void => {
    if (!isDragging || !dragElement || !dragPlaceholder) return;

    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;

    const rect = dragElement.getBoundingClientRect();
    dragPlaceholder.style.left = `${rect.left + deltaX}px`;
    dragPlaceholder.style.top = `${rect.top + deltaY}px`;

    // Trouver l'élément sous le curseur
    const elementBelow = doc.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
    if (elementBelow && elementBelow !== dragElement && !elementBelow.closest("#icontrol-editor-panel")) {
      elementBelow.style.outline = "2px dashed #4CAF50";
    }

    e.preventDefault();
  };

  const handleMouseUp = (e: MouseEvent): void => {
    if (!isDragging || !dragElement || !dragPlaceholder) return;

    // Trouver l'élément cible
    const target = doc.elementFromPoint(e.clientX, e.clientY) as HTMLElement;
    
    if (target && target !== dragElement && target.parentElement && !target.closest("#icontrol-editor-panel")) {
      // Réorganiser l'élément
      if (dragElement.parentElement) {
        const targetRect = target.getBoundingClientRect();
        
        // Déterminer si on doit insérer avant ou après
        if (e.clientY < targetRect.top + targetRect.height / 2) {
          target.parentElement.insertBefore(dragElement, target);
        } else {
          target.parentElement.insertBefore(dragElement, target.nextSibling);
        }
      }
    }

    // Nettoyer
    dragElement.style.opacity = "1";
    dragElement.style.cursor = "";
    if (dragPlaceholder && dragPlaceholder.parentElement) {
      dragPlaceholder.parentElement.removeChild(dragPlaceholder);
    }
    
    doc.querySelectorAll("[style*='outline'][style*='dashed']").forEach((el) => {
      const htmlEl = el as HTMLElement;
      if (htmlEl !== dragPlaceholder) {
        htmlEl.style.outline = "";
      }
    });

    isDragging = false;
    dragElement = null;
    dragPlaceholder = null;

    popup.dispatchEvent(new CustomEvent("icontrol-editor-select"));
    e.preventDefault();
  };

  // Exposer les fonctions globalement
  popup.icontrolEditor = {
    enableEditMode,
    disableEditMode,
    getSelectedElement: () => selectedElement || doc.querySelector("[data-selected='true']"),
    updateSelectedElement: (changes: { id?: string; className?: string; style?: Record<string, string> }) => {
      const el = selectedElement || doc.querySelector("[data-selected='true']");
      if (el) {
        if (changes.id) el.id = changes.id;
        if (changes.className) el.className = changes.className;
        if (changes.style) Object.assign(el.style, changes.style);
      }
    },
    deleteSelectedElement: () => {
      const el = selectedElement || doc.querySelector("[data-selected='true']");
      if (el && el.parentElement) {
        el.parentElement.removeChild(el);
        selectedElement = null;
      }
    },
    isEditMode: () => editMode
  };

  console.log("Éditeur visuel initialisé dans la popup", popup.icontrolEditor);
  popup.dispatchEvent(new CustomEvent('icontrol-editor-ready'));
}

export function openVisualEditorWindow(page: PageInfo): void {
  const savedSize = localStorage.getItem(LS_KEY_EDITOR_WINDOW_SIZE);
  // Responsive sizing: fullscreen on mobile, windowed on desktop
  const isMobile = window.innerWidth < 768;
  let width = isMobile ? screen.width : 1600;
  let height = isMobile ? screen.height : 1000;
  if (savedSize && !isMobile) {
    try {
      const size = JSON.parse(savedSize);
      width = size.width;
      height = size.height;
    } catch (e) {
      console.error("Failed to parse saved window size:", e);
    }
  }

  const fullUrl = window.location.origin + page.path;
  const popup = window.open(
    fullUrl,
    `icontrol-editor-${page.id}`,
    `width=${width},height=${height},resizable=yes,scrollbars=yes,menubar=no,toolbar=no,location=no,status=no`
  );

  if (!popup) {
    return;
  }

  // Attendre que la page soit chargée
  const checkReady = setInterval(() => {
    try {
      if (popup.document.readyState === "complete" && popup.document.body) {
        clearInterval(checkReady);
        setTimeout(() => setupVisualEditorPanel(popup, page), 1000);
      }
    } catch (e) {}
  }, 100);

  setTimeout(() => {
    clearInterval(checkReady);
    try {
      if (popup.document.readyState === "complete") {
        setupVisualEditorPanel(popup, page);
      }
    } catch (e) {
      console.warn("Impossible d'accéder au document de la popup:", e);
    }
  }, 5000);

  // Sauvegarder les dimensions à la fermeture
  popup.addEventListener("beforeunload", () => {
    try {
      localStorage.setItem(LS_KEY_EDITOR_WINDOW_SIZE, JSON.stringify({
        width: popup.outerWidth,
        height: popup.outerHeight,
      }));
    } catch (e) {}
  });
}

function setupVisualEditorPanel(popup: Window, page: PageInfo): void {
  try {
    const doc = popup.document;
    const savedPanelWidth = localStorage.getItem(LS_KEY_EDITOR_PANEL_WIDTH);
    const panelWidth = savedPanelWidth ? parseInt(savedPanelWidth, 10) : 320;

    // Styles complets pour le panneau d'édition
    const style = doc.createElement("style");
    style.id = "icontrol-visual-editor-styles";
    style.textContent = `
      * { box-sizing: border-box; }
      body { margin: 0; padding: 0; }
      #icontrol-editor-main-content {
        margin-right: ${panelWidth}px;
        transition: margin-right 0.3s;
      }
      #icontrol-editor-panel {
        position: fixed;
        top: 0;
        right: 0;
        width: ${panelWidth}px;
        height: 100vh;
        background: #f5f5f5;
        border-left: 1px solid #ddd;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        overflow: hidden;
        font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", Segoe UI, Roboto, Helvetica, Arial, sans-serif;
      }
      #icontrol-editor-panel-header {
        padding: 12px 16px;
        background: #fff;
        border-bottom: 1px solid #ddd;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      #icontrol-editor-panel-title {
        font-size: 14px;
        font-weight: 600;
        color: #333;
      }
      #icontrol-editor-panel-tabs {
        display: flex;
        background: #fff;
        border-bottom: 1px solid #ddd;
      }
      #icontrol-editor-panel-tabs button {
        flex: 1;
        padding: 10px 12px;
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: #666;
        cursor: pointer;
        font-size: 13px;
        font-weight: 500;
        transition: all 0.2s;
      }
      #icontrol-editor-panel-tabs button:hover {
        color: #333;
        background: #f9f9f9;
      }
      #icontrol-editor-panel-tabs button.active {
        color: #007AFF;
        border-bottom-color: #007AFF;
        font-weight: 600;
      }
      #icontrol-editor-panel-content {
        flex: 1;
        overflow-y: auto;
        padding: 16px;
        background: #f5f5f5;
      }
      .icontrol-editor-section {
        margin-bottom: 24px;
      }
      .icontrol-editor-section-title {
        font-size: 12px;
        font-weight: 600;
        color: #666;
        text-transform: uppercase;
        margin-bottom: 12px;
        letter-spacing: 0.5px;
      }
      .icontrol-editor-tools-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 8px;
        margin-bottom: 16px;
      }
      .icontrol-editor-tool-btn {
        width: 100%;
        aspect-ratio: 1;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 6px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
        transition: all 0.2s;
      }
      .icontrol-editor-tool-btn:hover {
        background: #f0f0f0;
        border-color: #007AFF;
      }
      .icontrol-editor-tool-btn.active {
        background: #007AFF;
        color: white;
        border-color: #007AFF;
      }
      .icontrol-editor-element-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .icontrol-editor-element-item {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
      }
      .icontrol-editor-element-item:hover {
        background: #f0f0f0;
        border-color: #007AFF;
      }
      .icontrol-editor-element-icon {
        width: 24px;
        height: 24px;
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        flex-shrink: 0;
      }
      .icontrol-editor-input-group {
        margin-bottom: 16px;
      }
      .icontrol-editor-label {
        display: block;
        font-size: 12px;
        font-weight: 600;
        color: #666;
        margin-bottom: 6px;
      }
      .icontrol-editor-input {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 13px;
        background: #fff;
      }
      .icontrol-editor-input:focus {
        outline: none;
        border-color: #007AFF;
      }
      .icontrol-editor-select {
        width: 100%;
        padding: 8px 12px;
        border: 1px solid #ddd;
        border-radius: 6px;
        font-size: 13px;
        background: #fff;
        cursor: pointer;
      }
      .icontrol-editor-color-picker {
        width: 100%;
        height: 40px;
        border: 1px solid #ddd;
        border-radius: 6px;
        cursor: pointer;
      }
      .icontrol-editor-button-group {
        display: flex;
        gap: 4px;
        margin-bottom: 12px;
      }
      .icontrol-editor-button {
        flex: 1;
        padding: 6px;
        background: #fff;
        border: 1px solid #ddd;
        border-radius: 4px;
        cursor: pointer;
        font-size: 12px;
        transition: all 0.2s;
      }
      .icontrol-editor-button:hover {
        background: #f0f0f0;
      }
      .icontrol-editor-button.active {
        background: #007AFF;
        color: white;
        border-color: #007AFF;
      }
      .icontrol-editor-slider {
        width: 100%;
        height: 4px;
        background: #ddd;
        border-radius: 2px;
        outline: none;
        -webkit-appearance: none;
      }
      .icontrol-editor-slider::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 16px;
        height: 16px;
        background: #007AFF;
        border-radius: 50%;
        cursor: pointer;
      }
      .icontrol-editor-slider::-moz-range-thumb {
        width: 16px;
        height: 16px;
        background: #007AFF;
        border-radius: 50%;
        cursor: pointer;
        border: none;
      }
      .icontrol-editor-resizer {
        position: absolute;
        left: -4px;
        top: 0;
        bottom: 0;
        width: 8px;
        cursor: ew-resize;
        z-index: 10001;
      }
      [data-selected="true"] {
        outline: 2px dashed #007AFF !important;
        outline-offset: 2px !important;
        position: relative;
      }
      [data-selected="true"]::before {
        content: "";
        position: absolute;
        top: -2px;
        left: -2px;
        right: -2px;
        bottom: -2px;
        border: 2px dashed #007AFF;
        pointer-events: none;
        z-index: 9999;
      }
      [data-editable-highlight]:hover {
        outline: 1px dashed rgba(0, 122, 255, 0.5) !important;
        cursor: pointer !important;
      }
      body.edit-mode {
        cursor: crosshair !important;
      }
      body.edit-mode * {
        cursor: crosshair !important;
      }
      body.edit-mode [data-editable-highlight] {
        cursor: pointer !important;
      }
    `;
    if (!doc.getElementById("icontrol-visual-editor-styles")) {
      doc.head.appendChild(style);
    }

    // Wrapper pour le contenu principal
    let mainContentWrapper = doc.getElementById("icontrol-editor-main-content");
    if (!mainContentWrapper) {
      mainContentWrapper = doc.createElement("div");
      mainContentWrapper.id = "icontrol-editor-main-content";
      mainContentWrapper.style.minWidth = "0";
      mainContentWrapper.style.boxSizing = "border-box";
      while (doc.body.firstChild) {
        mainContentWrapper.appendChild(doc.body.firstChild);
      }
      doc.body.appendChild(mainContentWrapper);
    }

    // Créer le panneau d'édition
    const editorPanel = doc.createElement("div");
    editorPanel.id = "icontrol-editor-panel";
    editorPanel.style.minWidth = "0";
    editorPanel.style.boxSizing = "border-box";
    editorPanel.innerHTML = `
      <div id="icontrol-editor-panel-header">
        <div id="icontrol-editor-panel-title">Éditeur</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <select id="responsive-view-select" style="padding:6px 8px;border:1px solid #ddd;border-radius:6px;font-size:11px;cursor:pointer;">
            <option value="100">Desktop (100%)</option>
            <option value="1920">Desktop Large (1920px)</option>
            <option value="1440">Desktop (1440px)</option>
            <option value="1280">Laptop (1280px)</option>
            <option value="1024">Tablette (1024px)</option>
            <option value="768">Tablette (768px)</option>
            <option value="414">Mobile (414px)</option>
            <option value="375">Mobile (375px)</option>
          </select>
          <button id="icontrol-toggle-edit-mode" style="padding:6px 12px;background:#ff3b30;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">
            Désactiver l'édition
          </button>
          <button id="icontrol-publish-btn" style="padding:6px 12px;background:#4CAF50;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">
            📤 Publier
          </button>
        </div>
      </div>
      <div id="icontrol-editor-panel-tabs">
        <button data-tab="inspect" class="active">Inspecter</button>
        <button data-tab="style">Style</button>
        <button data-tab="appearance">Apparence</button>
        <button data-tab="icons">Icônes</button>
        <button data-tab="tools">Outils</button>
      </div>
      <div id="icontrol-editor-panel-content">
        <!-- Contenu sera rendu dynamiquement selon l'onglet -->
      </div>
    `;
    doc.body.appendChild(editorPanel);

    // Initialiser l'éditeur APRÈS la création du panneau (solution autonome)
    initializeEditorFunctionsInPopup(doc, popup);

    // Resizer pour le panneau
    const resizer = doc.createElement("div");
    resizer.className = "icontrol-editor-resizer";
    editorPanel.appendChild(resizer);

    let isResizing = false;
    resizer.addEventListener("mousedown", (e) => {
      isResizing = true;
      doc.body.style.cursor = "ew-resize";
      doc.body.style.userSelect = "none";
    });
    doc.addEventListener("mousemove", (e) => {
      if (!isResizing) return;
      const newWidth = doc.body.offsetWidth - e.clientX;
      if (newWidth > 250 && newWidth < doc.body.offsetWidth * 0.7) {
        editorPanel.style.width = `${newWidth}px`;
        mainContentWrapper!.style.marginRight = `${newWidth}px`;
      }
    });
    doc.addEventListener("mouseup", () => {
      if (isResizing) {
        isResizing = false;
        doc.body.style.cursor = "";
        doc.body.style.userSelect = "";
        localStorage.setItem(LS_KEY_EDITOR_PANEL_WIDTH, editorPanel.style.width);
      }
    });

    // Gérer les onglets
    const tabButtons = editorPanel.querySelectorAll("#icontrol-editor-panel-tabs button");
    const panelContent = editorPanel.querySelector("#icontrol-editor-panel-content") as HTMLElement;

    const switchTab = (tabId: string) => {
      tabButtons.forEach(btn => {
        if ((btn as HTMLElement).dataset.tab === tabId) {
          btn.classList.add("active");
        } else {
          btn.classList.remove("active");
        }
      });
      renderTabContent(tabId, panelContent, doc, popup);
    };

    tabButtons.forEach(btn => {
      (btn as HTMLElement).onclick = () => {
        const tabId = (btn as HTMLElement).dataset.tab || "inspect";
        switchTab(tabId);
      };
    });

    // Toggle edit mode - récupérer le bouton d'abord
    const toggleBtn = editorPanel.querySelector("#icontrol-toggle-edit-mode") as HTMLButtonElement;
    
    // Fonction pour activer/désactiver le mode édition
    const toggleEditMode = () => {
      try {
        if (!popup.icontrolEditor) {
          console.warn("L'éditeur n'est pas encore chargé");
          toggleBtn.disabled = true;
          toggleBtn.textContent = "Chargement...";
          return false;
        }
        
        toggleBtn.disabled = false;
        
        if (popup.icontrolEditor.isEditMode()) {
          popup.icontrolEditor.disableEditMode();
          toggleBtn.textContent = "Activer l'édition";
          toggleBtn.style.background = "#007AFF";
        } else {
          popup.icontrolEditor.enableEditMode();
          toggleBtn.textContent = "Désactiver l'édition";
          toggleBtn.style.background = "#ff3b30";
        }
        renderTabContent(editorPanel.querySelector("button.active")?.getAttribute("data-tab") || "inspect", panelContent, doc, popup);
        return true;
      } catch (e) {
        console.error("Erreur lors du basculement du mode édition:", e);
        toggleBtn.disabled = false;
        return false;
      }
    };
    
    // Attacher le handler au bouton
    if (toggleBtn) {
      toggleBtn.onclick = () => {
        toggleEditMode();
      };
    }
    
    // Activer automatiquement le mode édition quand l'éditeur est prêt
    const enableEditModeWhenReady = () => {
      try {
        if (popup.icontrolEditor && !popup.icontrolEditor.isEditMode()) {
          const result = popup.icontrolEditor.enableEditMode();
          if (result) {
            toggleBtn.textContent = "Désactiver l'édition";
            toggleBtn.style.background = "#ff3b30";
            renderTabContent(editorPanel.querySelector("button.active")?.getAttribute("data-tab") || "inspect", panelContent, doc, popup);
            console.log("Mode édition activé automatiquement");
          }
        }
      } catch (e) {
        console.error("Erreur lors de l'activation automatique:", e);
      }
    };
    
    // Écouter l'événement de chargement de l'éditeur
    popup.addEventListener('icontrol-editor-ready', () => {
      // Attendre un peu pour que tout soit prêt avant d'activer
      setTimeout(enableEditModeWhenReady, 200);
    });
    
    // Activer automatiquement après un court délai (fallback)
    setTimeout(() => {
      if (popup.icontrolEditor && !popup.icontrolEditor.isEditMode()) {
        enableEditModeWhenReady();
      }
    }, 500);

    // Sélecteur de vue responsive
    const responsiveSelect = editorPanel.querySelector("#responsive-view-select") as HTMLSelectElement;
    if (responsiveSelect) {
      responsiveSelect.addEventListener("change", (e) => {
        const width = (e.target as HTMLSelectElement).value;
        const mainContent = doc.getElementById("icontrol-editor-main-content");
        if (mainContent) {
          if (width === "100") {
            mainContent.style.maxWidth = "100%";
            mainContent.style.margin = "0 auto";
            mainContent.style.border = "none";
            mainContent.style.boxShadow = "none";
            mainContent.style.backgroundColor = "";
          } else {
            mainContent.style.maxWidth = `${width}px`;
            mainContent.style.margin = "0 auto";
            mainContent.style.border = "1px solid #ddd";
            mainContent.style.boxShadow = "0 0 20px rgba(0,0,0,0.1)";
            mainContent.style.backgroundColor = "#fff";
            mainContent.style.minHeight = "100vh";
          }
          popup.dispatchEvent(new CustomEvent("icontrol-editor-select"));
        }
      });
    }
    
    // Bouton Publier
    const publishBtn = editorPanel.querySelector("#icontrol-publish-btn") as HTMLButtonElement;
    publishBtn.onclick = async () => {
      const pageId = popup.location.hash || popup.location.pathname;
      const pageName = popup.document.title || "Page inconnue";
      
      // Confirmer la publication
      if (!popup.confirm(`Voulez-vous publier les modifications pour "${pageName}" ?\n\nLes modifications seront appliquées après le prochain rafraîchissement de la page.`)) {
        return;
      }
      
      try {
        // Charger le module de gestion des modifications
        const { publishToProduction } = await import("/src/core/pageEditor/pageModificationManager");
        
        // Collecter toutes les modifications actuelles
        const modifications: Record<string, any> = {};
        popup.document.querySelectorAll("[data-selected], [style*='position'], [style*='top'], [style*='left'], [id], [class]").forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl.id || htmlEl.className) {
            modifications[htmlEl.id || `class_${htmlEl.className.replace(/\s+/g, '_')}`] = {
              id: htmlEl.id,
              className: htmlEl.className,
              style: htmlEl.style.cssText,
              innerHTML: htmlEl.innerHTML.substring(0, 500), // Limiter la taille
              tagName: htmlEl.tagName.toLowerCase(),
              selector: htmlEl.id ? `#${htmlEl.id}` : `.${htmlEl.className.split(' ')[0]}` || ''
            };
          }
        });
        
        // Créer une modification
        const modificationId = `mod_${Date.now()}`;
        const { saveDraftModification } = await import("/src/core/pageEditor/pageModificationManager");
        
        saveDraftModification({
          id: modificationId,
          pageId,
          pageName,
          modifications,
          status: "draft",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          version: "1.0"
        });
        
        // Publier directement en production (pour simplifier)
        // Dans un vrai système, vous passeriez par test d'abord
        const result = publishToProduction(modificationId, "current_user");
        
        if (result) {
          popup.alert("✅ Modifications publiées avec succès !\n\nLes modifications seront appliquées après le prochain rafraîchissement de la page.");
          
          // Marquer qu'une mise à jour est disponible
          popup.localStorage.setItem("icontrol_apply_modifications", "true");
          popup.localStorage.setItem("icontrol_modifications_page_id", pageId);
          popup.localStorage.setItem("icontrol_modifications_data", JSON.stringify(modifications));
        } else {
          popup.alert("❌ Erreur lors de la publication des modifications.");
        }
      } catch (e) {
        console.error("Erreur lors de la publication:", e);
        popup.alert("❌ Erreur lors de la publication. Vérifiez la console pour plus de détails.");
      }
    };

    // Écouter les changements de sélection (dans la fenêtre popup)
    const checkSelection = setInterval(() => {
      const activeTab = editorPanel.querySelector("button.active")?.getAttribute("data-tab") || "inspect";
      renderTabContent(activeTab, panelContent, doc, popup);
    }, 500);

    // Écouter les événements de sélection dans la fenêtre popup
    popup.addEventListener("icontrol-editor-select", () => {
      const activeTab = editorPanel.querySelector("button.active")?.getAttribute("data-tab") || "inspect";
      renderTabContent(activeTab, panelContent, doc, popup);
    });

    // Nettoyer l'intervalle quand la fenêtre se ferme
    popup.addEventListener("beforeunload", () => {
      clearInterval(checkSelection);
    });

    // Rendu initial
    switchTab("inspect");
  } catch (e) {
    console.error("Erreur lors de la configuration du panneau d'édition:", e);
  }
}

function renderTabContent(tabId: string, host: HTMLElement, doc: Document, popup: Window): void {
  host.innerHTML = "";

  if (tabId === "inspect") {
    // Obtenir l'élément sélectionné depuis la fenêtre popup
    const selected = popup.icontrolEditor?.getSelectedElement() || null;
    
    // Section Outils
    const toolsSection = doc.createElement("div");
    toolsSection.className = "icontrol-editor-section";
    toolsSection.innerHTML = `
      <div class="icontrol-editor-section-title">Outils</div>
      <div class="icontrol-editor-tools-grid">
        <button class="icontrol-editor-tool-btn" title="Texte" style="font-size:20px;font-weight:bold;">T</button>
        <button class="icontrol-editor-tool-btn" title="Carré" style="font-size:16px;">□</button>
        <button class="icontrol-editor-tool-btn" title="Alignement gauche" style="font-size:14px;">☰</button>
        <button class="icontrol-editor-tool-btn" title="Alignement centre" style="font-size:14px;">☰</button>
        <button class="icontrol-editor-tool-btn" title="Grille" style="font-size:14px;">⊞</button>
        <button class="icontrol-editor-tool-btn" title="Grille" style="font-size:14px;">⊞</button>
        <button class="icontrol-editor-tool-btn" title="Ligne" style="font-size:14px;">─</button>
        <button class="icontrol-editor-tool-btn" title="Tableau" style="font-size:14px;">TB→</button>
        <button class="icontrol-editor-tool-btn" title="Checkbox" style="font-size:14px;">☑</button>
        <button class="icontrol-editor-tool-btn" title="Checkbox" style="font-size:14px;">☑</button>
        <button class="icontrol-editor-tool-btn" title="Radio" style="font-size:14px;">○</button>
      </div>
      <div class="icontrol-editor-element-list">
        <div class="icontrol-editor-element-item" style="cursor:pointer;" data-add-element="button">
          <div class="icontrol-editor-element-icon" style="background:#e0e0e0;">⚬</div>
          <span>Bouton</span>
        </div>
        <div class="icontrol-editor-element-item" style="cursor:pointer;" data-add-element="table">
          <div class="icontrol-editor-element-icon" style="background:#4CAF50;">⊞</div>
          <span>Tableau</span>
        </div>
        <div class="icontrol-editor-element-item" style="cursor:pointer;" data-add-element="text">
          <div class="icontrol-editor-element-icon" style="background:#4A90E2;">T</div>
          <span>Zone de texte</span>
        </div>
        <div class="icontrol-editor-element-item" style="cursor:pointer;" data-add-element="card">
          <div class="icontrol-editor-element-icon" style="background:#FF9800;">□</div>
          <span>Carte</span>
        </div>
        <div class="icontrol-editor-element-item" style="cursor:pointer;" data-add-element="section">
          <div class="icontrol-editor-element-icon" style="background:#9E9E9E;">☰</div>
          <span>Section</span>
        </div>
      </div>
    `;
    host.appendChild(toolsSection);

    // Event listeners pour ajout d'éléments
    setTimeout(() => {
      doc.querySelectorAll(".icontrol-editor-element-item[data-add-element]").forEach((item) => {
        item.addEventListener("click", () => {
          const elementType = (item as HTMLElement).dataset.addElement;
          const mainContent = doc.getElementById("icontrol-editor-main-content");
          if (!mainContent) return;

          let newElement: HTMLElement;
          
          switch (elementType) {
            case "button":
              newElement = doc.createElement("button");
              newElement.textContent = "Nouveau bouton";
              newElement.style.cssText = "padding:10px 16px;border-radius:8px;border:1px solid #ddd;background:#007AFF;color:white;cursor:pointer;margin:8px;";
              break;
            case "table":
              newElement = doc.createElement("table");
              newElement.style.cssText = "width:100%;border-collapse:collapse;margin:8px;";
              const headerRow = doc.createElement("tr");
              ["Colonne 1", "Colonne 2", "Colonne 3"].forEach((headerText) => {
                const th = doc.createElement("th");
                th.textContent = headerText;
                th.style.cssText = "padding:10px;border:1px solid #ddd;background:#f5f5f5;font-weight:600;";
                headerRow.appendChild(th);
              });
              newElement.appendChild(headerRow);
              for (let i = 0; i < 2; i++) {
                const row = doc.createElement("tr");
                for (let j = 0; j < 3; j++) {
                  const td = doc.createElement("td");
                  td.textContent = `Cellule ${i + 1}-${j + 1}`;
                  td.style.cssText = "padding:10px;border:1px solid #ddd;";
                  row.appendChild(td);
                }
                newElement.appendChild(row);
              }
              break;
            case "text":
              newElement = doc.createElement("div");
              newElement.textContent = "Nouveau texte";
              newElement.style.cssText = "padding:12px;color:#333;margin:8px;";
              break;
            case "card":
              newElement = doc.createElement("div");
              newElement.className = "cxCard";
              newElement.textContent = "Nouvelle carte";
              newElement.style.cssText = "padding:20px;border:1px solid #ddd;border-radius:12px;background:#fff;margin:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);";
              break;
            case "section":
              newElement = doc.createElement("section");
              newElement.textContent = "Nouvelle section";
              newElement.style.cssText = "padding:20px;border:1px solid #ddd;border-radius:12px;margin:16px 8px;background:#f9f9f9;";
              break;
            default:
              return;
          }

          newElement.id = `element_${Date.now()}`;
          newElement.setAttribute("data-editable-highlight", "true");
          newElement.setAttribute("data-selected", "true");
          
          // Sauvegarder l'état pour undo
          saveState("add", newElement, () => ({ action: "add", elementId: newElement.id }));
          
          mainContent.appendChild(newElement);
          selectedElement = newElement;
          popup.dispatchEvent(new CustomEvent("icontrol-editor-select"));
        });
      });
    }, 100);

    // Section Élément sélectionné
    if (selected) {
      const selectedSection = doc.createElement("div");
      selectedSection.className = "icontrol-editor-section";
      selectedSection.innerHTML = `
        <div class="icontrol-editor-section-title">Élément sélectionné</div>
        <div class="icontrol-editor-input-group">
          <label class="icontrol-editor-label">Tag</label>
          <input type="text" class="icontrol-editor-input" value="${selected.tagName.toLowerCase()}" readonly />
        </div>
        <div class="icontrol-editor-input-group">
          <label class="icontrol-editor-label">ID</label>
          <input type="text" class="icontrol-editor-input" value="${selected.id || ''}" id="element-id-input" />
        </div>
        <div class="icontrol-editor-input-group">
          <label class="icontrol-editor-label">Classes</label>
          <input type="text" class="icontrol-editor-input" value="${selected.className || ''}" id="element-classes-input" />
        </div>
        <div style="margin-top:16px;display:flex;gap:8px;">
          <button id="delete-element-btn" style="flex:1;padding:8px;background:#ff3b30;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">
            Supprimer
          </button>
          <button id="rename-element-btn" style="flex:1;padding:8px;background:#007AFF;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;font-weight:600;">
            Renommer
          </button>
        </div>
      `;
      host.appendChild(selectedSection);

      // Event listeners
      doc.getElementById("delete-element-btn")?.addEventListener("click", () => {
        popup.icontrolEditor?.deleteSelectedElement();
        setTimeout(() => renderTabContent("inspect", host, doc, popup), 100);
      });

      doc.getElementById("element-id-input")?.addEventListener("change", (e) => {
        const newId = (e.target as HTMLInputElement).value;
        popup.icontrolEditor?.updateSelectedElement({ id: newId });
      });

      doc.getElementById("element-classes-input")?.addEventListener("change", (e) => {
        const newClasses = (e.target as HTMLInputElement).value;
        popup.icontrolEditor?.updateSelectedElement({ className: newClasses });
      });
    } else {
      const noSelection = doc.createElement("div");
      noSelection.className = "icontrol-editor-section";
      noSelection.innerHTML = `
        <div style="text-align:center;color:#999;padding:40px 20px;font-size:13px;">
          Aucun élément sélectionné.<br/>
          Activez l'édition et cliquez sur un élément.
        </div>
      `;
      host.appendChild(noSelection);
    }
  } else if (tabId === "style") {
    const selected = popup.icontrolEditor?.getSelectedElement() || null;
    const styleSection = doc.createElement("div");
    styleSection.className = "icontrol-editor-section";
    
    const computedStyle = selected ? popup.getComputedStyle(selected) : null;
    
    styleSection.innerHTML = `
      <div class="icontrol-editor-section-title">Style CSS Avancé</div>
      
      <div class="icontrol-editor-input-group">
        <label class="icontrol-editor-label">Margin (px)</label>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;">
          <input type="number" id="margin-top" placeholder="Haut" class="icontrol-editor-input" style="width:100%;" />
          <input type="number" id="margin-right" placeholder="Droite" class="icontrol-editor-input" style="width:100%;" />
          <input type="number" id="margin-bottom" placeholder="Bas" class="icontrol-editor-input" style="width:100%;" />
          <input type="number" id="margin-left" placeholder="Gauche" class="icontrol-editor-input" style="width:100%;" />
        </div>
      </div>
      
      <div class="icontrol-editor-input-group">
        <label class="icontrol-editor-label">Padding (px)</label>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;">
          <input type="number" id="padding-top" placeholder="Haut" class="icontrol-editor-input" style="width:100%;" />
          <input type="number" id="padding-right" placeholder="Droite" class="icontrol-editor-input" style="width:100%;" />
          <input type="number" id="padding-bottom" placeholder="Bas" class="icontrol-editor-input" style="width:100%;" />
          <input type="number" id="padding-left" placeholder="Gauche" class="icontrol-editor-input" style="width:100%;" />
        </div>
      </div>
      
      <div class="icontrol-editor-input-group">
        <label class="icontrol-editor-label">Bordures</label>
        <div style="display:flex;gap:4px;align-items:center;">
          <input type="number" id="border-width" placeholder="Largeur" class="icontrol-editor-input" style="width:80px;" />
          <select id="border-style" class="icontrol-editor-select" style="flex:1;">
            <option value="solid">Solide</option>
            <option value="dashed">Tiret</option>
            <option value="dotted">Pointillé</option>
            <option value="double">Double</option>
            <option value="none">Aucun</option>
          </select>
          <input type="color" id="border-color-style" value="#ddd" style="width:60px;height:40px;" />
        </div>
        <input type="number" id="border-radius" placeholder="Border radius (px)" class="icontrol-editor-input" style="margin-top:8px;" />
      </div>
      
      <div class="icontrol-editor-input-group">
        <label class="icontrol-editor-label">Ombre (Box Shadow)</label>
        <div style="display:flex;gap:4px;">
          <input type="number" id="shadow-x" placeholder="X" class="icontrol-editor-input" style="width:60px;" />
          <input type="number" id="shadow-y" placeholder="Y" class="icontrol-editor-input" style="width:60px;" />
          <input type="number" id="shadow-blur" placeholder="Flou" class="icontrol-editor-input" style="width:60px;" />
          <input type="color" id="shadow-color" value="#000" style="width:60px;height:40px;" />
        </div>
      </div>
      
      <div class="icontrol-editor-input-group">
        <label class="icontrol-editor-label">Transformation</label>
        <div style="display:flex;gap:4px;">
          <input type="number" id="transform-rotate" placeholder="Rotation (°)" class="icontrol-editor-input" style="flex:1;" />
          <input type="number" id="transform-scale" placeholder="Scale (1.0)" class="icontrol-editor-input" style="flex:1;" step="0.1" />
        </div>
      </div>
    `;
    host.appendChild(styleSection);

    // Initialiser les valeurs depuis l'élément sélectionné
    if (selected && computedStyle) {
      setTimeout(() => {
        const marginMatch = computedStyle.margin.match(/(\d+)/g);
        if (marginMatch && marginMatch.length >= 4) {
          (doc.getElementById("margin-top") as HTMLInputElement).value = marginMatch[0];
          (doc.getElementById("margin-right") as HTMLInputElement).value = marginMatch[1];
          (doc.getElementById("margin-bottom") as HTMLInputElement).value = marginMatch[2];
          (doc.getElementById("margin-left") as HTMLInputElement).value = marginMatch[3];
        }

        const paddingMatch = computedStyle.padding.match(/(\d+)/g);
        if (paddingMatch && paddingMatch.length >= 4) {
          (doc.getElementById("padding-top") as HTMLInputElement).value = paddingMatch[0];
          (doc.getElementById("padding-right") as HTMLInputElement).value = paddingMatch[1];
          (doc.getElementById("padding-bottom") as HTMLInputElement).value = paddingMatch[2];
          (doc.getElementById("padding-left") as HTMLInputElement).value = paddingMatch[3];
        }

        // Event listeners pour les modifications CSS
        ["margin-top", "margin-right", "margin-bottom", "margin-left"].forEach((id) => {
          doc.getElementById(id)?.addEventListener("input", (e) => {
            const value = (e.target as HTMLInputElement).value;
            const currentSelected = popup.icontrolEditor?.getSelectedElement();
            if (currentSelected && value) {
              const prop = id.replace("-", "");
              currentSelected.style[prop as any] = `${value}px`;
            }
          });
        });

        ["padding-top", "padding-right", "padding-bottom", "padding-left"].forEach((id) => {
          doc.getElementById(id)?.addEventListener("input", (e) => {
            const value = (e.target as HTMLInputElement).value;
            const currentSelected = popup.icontrolEditor?.getSelectedElement();
            if (currentSelected && value) {
              const prop = id.replace("-", "");
              currentSelected.style[prop as any] = `${value}px`;
            }
          });
        });

        doc.getElementById("border-width")?.addEventListener("input", (e) => {
          const width = (e.target as HTMLInputElement).value;
          const style = (doc.getElementById("border-style") as HTMLSelectElement).value;
          const color = (doc.getElementById("border-color-style") as HTMLInputElement).value;
          const currentSelected = popup.icontrolEditor?.getSelectedElement();
          if (currentSelected && width) {
            currentSelected.style.border = `${width}px ${style} ${color}`;
          }
        });

        doc.getElementById("border-style")?.addEventListener("change", (e) => {
          const width = (doc.getElementById("border-width") as HTMLInputElement).value || "1";
          const style = (e.target as HTMLSelectElement).value;
          const color = (doc.getElementById("border-color-style") as HTMLInputElement).value;
          const currentSelected = popup.icontrolEditor?.getSelectedElement();
          if (currentSelected) {
            currentSelected.style.border = `${width}px ${style} ${color}`;
          }
        });

        doc.getElementById("border-color-style")?.addEventListener("change", (e) => {
          const width = (doc.getElementById("border-width") as HTMLInputElement).value || "1";
          const style = (doc.getElementById("border-style") as HTMLSelectElement).value;
          const color = (e.target as HTMLInputElement).value;
          const currentSelected = popup.icontrolEditor?.getSelectedElement();
          if (currentSelected) {
            currentSelected.style.border = `${width}px ${style} ${color}`;
          }
        });

        doc.getElementById("border-radius")?.addEventListener("input", (e) => {
          const radius = (e.target as HTMLInputElement).value;
          const currentSelected = popup.icontrolEditor?.getSelectedElement();
          if (currentSelected && radius) {
            currentSelected.style.borderRadius = `${radius}px`;
          }
        });

        doc.getElementById("shadow-x")?.addEventListener("input", updateShadow);
        doc.getElementById("shadow-y")?.addEventListener("input", updateShadow);
        doc.getElementById("shadow-blur")?.addEventListener("input", updateShadow);
        doc.getElementById("shadow-color")?.addEventListener("change", updateShadow);

        function updateShadow() {
          const x = (doc.getElementById("shadow-x") as HTMLInputElement).value || "0";
          const y = (doc.getElementById("shadow-y") as HTMLInputElement).value || "0";
          const blur = (doc.getElementById("shadow-blur") as HTMLInputElement).value || "0";
          const color = (doc.getElementById("shadow-color") as HTMLInputElement).value || "#000";
          const currentSelected = popup.icontrolEditor?.getSelectedElement();
          if (currentSelected) {
            currentSelected.style.boxShadow = `${x}px ${y}px ${blur}px ${color}`;
          }
        }

        doc.getElementById("transform-rotate")?.addEventListener("input", (e) => {
          const rotate = (e.target as HTMLInputElement).value;
          const scale = (doc.getElementById("transform-scale") as HTMLInputElement).value || "1";
          const currentSelected = popup.icontrolEditor?.getSelectedElement();
          if (currentSelected) {
            currentSelected.style.transform = `rotate(${rotate}deg) scale(${scale})`;
          }
        });

        doc.getElementById("transform-scale")?.addEventListener("input", (e) => {
          const rotate = (doc.getElementById("transform-rotate") as HTMLInputElement).value || "0";
          const scale = (e.target as HTMLInputElement).value || "1";
          const currentSelected = popup.icontrolEditor?.getSelectedElement();
          if (currentSelected) {
            currentSelected.style.transform = `rotate(${rotate}deg) scale(${scale})`;
          }
        });
      }, 100);
    }
  } else if (tabId === "appearance") {
    const selected = popup.icontrolEditor?.getSelectedElement() || null;
    const appearanceSection = doc.createElement("div");
    appearanceSection.className = "icontrol-editor-section";
    appearanceSection.innerHTML = `
      <div class="icontrol-editor-section-title">Apparence</div>
      
      <div class="icontrol-editor-input-group">
        <label class="icontrol-editor-label">Police</label>
        <select class="icontrol-editor-select" id="font-family-select">
          <option>Helvetica</option>
          <option>Arial</option>
          <option>Times New Roman</option>
          <option>Courier New</option>
        </select>
      </div>
      
      <div class="icontrol-editor-input-group">
        <label class="icontrol-editor-label">Taille</label>
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="number" class="icontrol-editor-input" value="16" id="font-size-input" style="width:80px;" />
          <input type="color" class="icontrol-editor-color-picker" value="#000000" id="text-color-picker" style="width:60px;height:40px;" />
          <button class="icontrol-editor-button" id="italic-btn" style="font-style:italic;">I</button>
          <button class="icontrol-editor-button" id="underline-btn" style="text-decoration:underline;">U</button>
        </div>
      </div>
      
      <div class="icontrol-editor-input-group">
        <label class="icontrol-editor-label">Alignement</label>
        <div class="icontrol-editor-button-group">
          <button class="icontrol-editor-button active" data-align="left">☰</button>
          <button class="icontrol-editor-button" data-align="center">☰</button>
          <button class="icontrol-editor-button" data-align="right">☰</button>
          <button class="icontrol-editor-button" data-align="justify">☰</button>
        </div>
      </div>
      
      <div class="icontrol-editor-input-group">
        <label class="icontrol-editor-label">Opacité</label>
        <input type="range" class="icontrol-editor-slider" min="0" max="100" value="100" id="opacity-slider" />
      </div>
      
      <div class="icontrol-editor-input-group">
        <label class="icontrol-editor-label">Remplissage</label>
        <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">
          <select id="fill-type-select" style="width:100%;padding:6px;border:1px solid #ddd;border-radius:6px;font-size:12px;margin-bottom:8px;">
            <option value="solid">Couleur unie</option>
            <option value="gradient-linear">Dégradé linéaire</option>
            <option value="gradient-radial">Dégradé radial</option>
          </select>
          <div id="fill-solid-controls" style="width:100%;">
            <input type="color" class="icontrol-editor-color-picker" value="#ffffff" id="fill-color-picker" style="width:100%;height:40px;" />
          </div>
          <div id="fill-gradient-controls" style="width:100%;display:none;">
            <div style="display:flex;gap:4px;margin-bottom:8px;">
              <input type="color" id="gradient-color-1" value="#007AFF" style="width:48%;height:40px;" />
              <input type="color" id="gradient-color-2" value="#4CAF50" style="width:48%;height:40px;" />
            </div>
            <div style="display:flex;gap:4px;margin-bottom:8px;">
              <input type="number" id="gradient-angle" placeholder="Angle (°)" value="90" class="icontrol-editor-input" style="width:48%;" />
              <input type="number" id="gradient-stop" placeholder="Stop (%)" value="50" class="icontrol-editor-input" style="width:48%;" />
            </div>
            <button id="apply-gradient-btn" style="width:100%;padding:8px;background:#007AFF;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;">
              Appliquer le dégradé
            </button>
          </div>
        </div>
      </div>
      
      <div class="icontrol-editor-input-group">
        <label class="icontrol-editor-label">Palette de couleurs favorites</label>
        <div id="color-palette-favorites" style="display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin-bottom:8px;">
          <!-- Les couleurs favorites seront ajoutées ici -->
        </div>
        <div style="display:flex;gap:4px;">
          <input type="color" id="add-favorite-color" value="#007AFF" style="width:60px;height:40px;" />
          <button id="save-favorite-color-btn" style="flex:1;padding:8px;background:#4CAF50;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;">
            💾 Sauvegarder
          </button>
        </div>
      </div>
      
      <div class="icontrol-editor-input-group">
        <label class="icontrol-editor-label">Contour</label>
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="color" class="icontrol-editor-color-picker" value="#e0e0e0" id="border-color-picker" style="width:100%;height:40px;" />
        </div>
      </div>
      
      <div class="icontrol-editor-input-group">
        <label class="icontrol-editor-label">Couleur de sélection</label>
        <div style="display:flex;gap:8px;align-items:center;">
          <input type="color" class="icontrol-editor-color-picker" value="#007AFF" id="selection-color-picker" style="width:100%;height:40px;" />
        </div>
      </div>
    `;
    host.appendChild(appearanceSection);

    // Event listeners pour les contrôles d'apparence
    setTimeout(() => {
      const fontSizeInput = doc.getElementById("font-size-input") as HTMLInputElement;
      if (fontSizeInput && selected) {
        const computedStyle = window.getComputedStyle(selected);
        fontSizeInput.value = computedStyle.fontSize.replace("px", "") || "16";
      }
      
      fontSizeInput?.addEventListener("change", (e) => {
        const size = (e.target as HTMLInputElement).value;
        const currentSelected = popup.icontrolEditor?.getSelectedElement();
        if (currentSelected) {
          popup.icontrolEditor?.updateSelectedElement({ style: { fontSize: `${size}px` } });
        }
      });

      const textColorPicker = doc.getElementById("text-color-picker") as HTMLInputElement;
      if (textColorPicker && selected) {
        const computedStyle = popup.getComputedStyle(selected);
        textColorPicker.value = rgbToHex(computedStyle.color) || "#000000";
      }
      
      textColorPicker?.addEventListener("change", (e) => {
        const color = (e.target as HTMLInputElement).value;
        const currentSelected = popup.icontrolEditor?.getSelectedElement();
        if (currentSelected) {
          popup.icontrolEditor?.updateSelectedElement({ style: { color } });
        }
      });

      // Gestion du type de remplissage (solide ou dégradé)
      const fillTypeSelect = doc.getElementById("fill-type-select") as HTMLSelectElement;
      const fillSolidControls = doc.getElementById("fill-solid-controls") as HTMLElement;
      const fillGradientControls = doc.getElementById("fill-gradient-controls") as HTMLElement;
      
      fillTypeSelect?.addEventListener("change", (e) => {
        const type = (e.target as HTMLSelectElement).value;
        if (type === "solid") {
          fillSolidControls.style.display = "block";
          fillGradientControls.style.display = "none";
        } else {
          fillSolidControls.style.display = "none";
          fillGradientControls.style.display = "block";
        }
      });

      const fillColorPicker = doc.getElementById("fill-color-picker") as HTMLInputElement;
      if (fillColorPicker && selected) {
        const computedStyle = popup.getComputedStyle(selected);
        const bg = computedStyle.backgroundColor;
        // Vérifier si c'est un gradient
        if (bg.includes("gradient")) {
          fillTypeSelect.value = bg.includes("radial") ? "gradient-radial" : "gradient-linear";
          fillSolidControls.style.display = "none";
          fillGradientControls.style.display = "block";
        } else {
          fillColorPicker.value = rgbToHex(bg) || "#ffffff";
        }
      }
      
      fillColorPicker?.addEventListener("change", (e) => {
        const color = (e.target as HTMLInputElement).value;
        const currentSelected = popup.icontrolEditor?.getSelectedElement();
        if (currentSelected) {
          popup.icontrolEditor?.updateSelectedElement({ style: { backgroundColor: color } });
        }
      });

      // Gestion des dégradés
      const applyGradientBtn = doc.getElementById("apply-gradient-btn") as HTMLButtonElement;
      applyGradientBtn?.addEventListener("click", () => {
        const type = fillTypeSelect.value;
        const color1 = (doc.getElementById("gradient-color-1") as HTMLInputElement).value;
        const color2 = (doc.getElementById("gradient-color-2") as HTMLInputElement).value;
        const angle = (doc.getElementById("gradient-angle") as HTMLInputElement).value || "90";
        const stop = (doc.getElementById("gradient-stop") as HTMLInputElement).value || "50";
        
        const currentSelected = popup.icontrolEditor?.getSelectedElement();
        if (currentSelected) {
          let gradient = "";
          if (type === "gradient-linear") {
            gradient = `linear-gradient(${angle}deg, ${color1} ${stop}%, ${color2})`;
          } else if (type === "gradient-radial") {
            gradient = `radial-gradient(circle, ${color1} ${stop}%, ${color2})`;
          }
          popup.icontrolEditor?.updateSelectedElement({ style: { background: gradient } });
        }
      });

      // Palette de couleurs favorites
      const STORAGE_KEY_FAVORITE_COLORS = "icontrol_editor_favorite_colors";
      
      const loadFavoriteColors = (): string[] => {
        try {
          const stored = popup.localStorage.getItem(STORAGE_KEY_FAVORITE_COLORS);
          return stored ? JSON.parse(stored) : [];
        } catch {
          return [];
        }
      };

      const saveFavoriteColor = (color: string): void => {
        const favorites = loadFavoriteColors();
        if (!favorites.includes(color)) {
          favorites.push(color);
          // Limiter à 24 couleurs
          if (favorites.length > 24) favorites.shift();
          popup.localStorage.setItem(STORAGE_KEY_FAVORITE_COLORS, JSON.stringify(favorites));
          renderFavoriteColors();
        }
      };

      const renderFavoriteColors = (): void => {
        const paletteContainer = doc.getElementById("color-palette-favorites");
        if (!paletteContainer) return;
        
        const favorites = loadFavoriteColors();
        paletteContainer.innerHTML = "";
        
        favorites.forEach((color) => {
          const colorBtn = doc.createElement("button");
          colorBtn.style.cssText = `
            width:100%;aspect-ratio:1;background:${color};border:2px solid #ddd;
            border-radius:4px;cursor:pointer;position:relative;transition:all 0.2s;
          `;
          colorBtn.title = color;
          colorBtn.onmouseenter = () => {
            colorBtn.style.transform = "scale(1.1)";
            colorBtn.style.borderColor = "#007AFF";
            colorBtn.style.zIndex = "10";
          };
          colorBtn.onmouseleave = () => {
            colorBtn.style.transform = "";
            colorBtn.style.borderColor = "#ddd";
            colorBtn.style.zIndex = "1";
          };
          colorBtn.onclick = () => {
            const currentSelected = popup.icontrolEditor?.getSelectedElement();
            if (currentSelected) {
              popup.icontrolEditor?.updateSelectedElement({ style: { backgroundColor: color } });
              // Mettre à jour le sélecteur de couleur
              if (fillColorPicker) fillColorPicker.value = color;
            }
          };
          colorBtn.oncontextmenu = (e) => {
            e.preventDefault();
            if (popup.confirm(`Supprimer ${color} de la palette ?`)) {
              const favorites = loadFavoriteColors();
              const updated = favorites.filter((c: string) => c !== color);
              popup.localStorage.setItem(STORAGE_KEY_FAVORITE_COLORS, JSON.stringify(updated));
              renderFavoriteColors();
            }
          };
          paletteContainer.appendChild(colorBtn);
        });
      };

      const saveFavoriteColorBtn = doc.getElementById("save-favorite-color-btn") as HTMLButtonElement;
      saveFavoriteColorBtn?.addEventListener("click", () => {
        const colorInput = doc.getElementById("add-favorite-color") as HTMLInputElement;
        if (colorInput) {
          saveFavoriteColor(colorInput.value);
        }
      });

      // Initialiser la palette
      renderFavoriteColors();

      const borderColorPicker = doc.getElementById("border-color-picker") as HTMLInputElement;
      if (borderColorPicker && selected) {
        const computedStyle = popup.getComputedStyle(selected);
        borderColorPicker.value = rgbToHex(computedStyle.borderColor) || "#e0e0e0";
      }
      
      borderColorPicker?.addEventListener("change", (e) => {
        const color = (e.target as HTMLInputElement).value;
        const currentSelected = popup.icontrolEditor?.getSelectedElement();
        if (currentSelected) {
          popup.icontrolEditor?.updateSelectedElement({ style: { borderColor: color } });
        }
      });

      const selectionColorPicker = doc.getElementById("selection-color-picker") as HTMLInputElement;
      if (selectionColorPicker && selected) {
        selectionColorPicker.value = "#007AFF"; // Couleur par défaut
      }
      
      selectionColorPicker?.addEventListener("change", (e) => {
        const color = (e.target as HTMLInputElement).value;
        const currentSelected = popup.icontrolEditor?.getSelectedElement();
        if (currentSelected) {
          // Changer la couleur de la bordure de sélection (outline)
          currentSelected.style.outline = `2px solid ${color}`;
          currentSelected.style.outlineOffset = "2px";
          popup.dispatchEvent(new CustomEvent("icontrol-editor-select"));
        }
      });

      const opacitySlider = doc.getElementById("opacity-slider") as HTMLInputElement;
      if (opacitySlider && selected) {
        const computedStyle = popup.getComputedStyle(selected);
        const opacity = parseFloat(computedStyle.opacity) * 100 || 100;
        opacitySlider.value = opacity.toString();
      }
      
      opacitySlider?.addEventListener("input", (e) => {
        const opacity = (e.target as HTMLInputElement).value;
        const currentSelected = popup.icontrolEditor?.getSelectedElement();
        if (currentSelected) {
          popup.icontrolEditor?.updateSelectedElement({ style: { opacity: `${parseInt(opacity) / 100}` } });
        }
      });
    }, 100);

    // Boutons d'alignement
    setTimeout(() => {
      doc.querySelectorAll(".icontrol-editor-button[data-align]").forEach(btn => {
        btn.addEventListener("click", () => {
          doc.querySelectorAll(".icontrol-editor-button[data-align]").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          const align = (btn as HTMLElement).dataset.align;
          const currentSelected = popup.icontrolEditor?.getSelectedElement();
          if (currentSelected && align) {
            popup.icontrolEditor?.updateSelectedElement({ style: { textAlign: align } });
          }
        });
      });
    }, 100);
  } else if (tabId === "icons") {
    // Bibliothèque complète d'icônes
    const iconsLibrary: Record<string, string> = {
      // Navigation
      home: "🏠", search: "🔍", menu: "☰", close: "✕", arrowLeft: "←", arrowRight: "→", arrowUp: "↑", arrowDown: "↓",
      // Actions
      plus: "➕", minus: "➖", edit: "✏️", delete: "🗑️", save: "💾", undo: "↶", redo: "↷",
      copy: "📋", cut: "✂️", paste: "📄", duplicate: "📑", refresh: "🔄",
      // Communication
      mail: "✉️", phone: "📞", message: "💬", notification: "🔔", chat: "💭",
      // Médias
      image: "🖼️", video: "🎥", music: "🎵", file: "📄", folder: "📁", attachment: "📎",
      // Interface
      settings: "⚙️", user: "👤", users: "👥", lock: "🔒", unlock: "🔓", eye: "👁️", star: "⭐",
      heart: "❤️", like: "👍", dislike: "👎", share: "📤", download: "⬇️", upload: "⬆️",
      // Status
      check: "✓", checkmark: "✔️", cross: "✗", warning: "⚠️", info: "ℹ️", error: "❌",
      question: "❓", exclamation: "❗",
      // Arrows
      chevronLeft: "‹", chevronRight: "›",
      // Shapes
      circle: "⚪", square: "⬜", triangle: "▲", diamond: "♦",
      // Other
      clock: "🕐", calendar: "📅", location: "📍", tag: "🏷️", filter: "🔍", grid: "⊞", list: "☰",
      bell: "🔔", bookmark: "🔖", flag: "🚩", fire: "🔥", lightbulb: "💡", key: "🔑", gear: "⚙️",
      cart: "🛒", shopping: "🛍️", gift: "🎁", trophy: "🏆", medal: "🏅", certificate: "📜"
    };

    const iconsSection = doc.createElement("div");
    iconsSection.className = "icontrol-editor-section";
    
    const searchInput = doc.createElement("input");
    searchInput.type = "text";
    searchInput.placeholder = "Rechercher une icône...";
    searchInput.className = "icontrol-editor-input";
    searchInput.style.marginBottom = "16px";
    iconsSection.appendChild(searchInput);

    const iconsGrid = doc.createElement("div");
    iconsGrid.style.cssText = "display:grid;grid-template-columns:repeat(6,1fr);gap:8px;max-height:400px;overflow-y:auto;";
    
    let filteredIcons = Object.entries(iconsLibrary);
    
    const renderIcons = () => {
      iconsGrid.innerHTML = "";
      filteredIcons.forEach(([name, icon]) => {
        const iconBtn = doc.createElement("button");
        iconBtn.className = "icontrol-editor-icon-btn";
        iconBtn.textContent = icon;
        iconBtn.title = name;
        iconBtn.style.cssText = `
          width:100%;aspect-ratio:1;background:#fff;border:1px solid #ddd;
          border-radius:6px;cursor:pointer;font-size:20px;transition:all 0.2s;
        `;
        iconBtn.onmouseenter = () => {
          iconBtn.style.background = "#f0f0f0";
          iconBtn.style.borderColor = "#007AFF";
          iconBtn.style.transform = "scale(1.1)";
        };
        iconBtn.onmouseleave = () => {
          iconBtn.style.background = "#fff";
          iconBtn.style.borderColor = "#ddd";
          iconBtn.style.transform = "";
        };
        iconBtn.onclick = () => {
          const selected = popup.icontrolEditor?.getSelectedElement();
          if (selected) {
            // Ajouter l'icône au début du texte de l'élément
            const currentText = selected.textContent || "";
            selected.textContent = icon + " " + currentText.trim();
            popup.dispatchEvent(new CustomEvent("icontrol-editor-select"));
          } else {
            // Créer un nouveau bouton avec l'icône
            const button = doc.createElement("button");
            button.textContent = icon + " Bouton";
            button.style.cssText = "padding:10px 16px;border-radius:8px;border:1px solid #ddd;background:#007AFF;color:white;cursor:pointer;";
            const mainContent = doc.getElementById("icontrol-editor-main-content");
            if (mainContent) {
              mainContent.appendChild(button);
              popup.dispatchEvent(new CustomEvent("icontrol-editor-select"));
            }
          }
        };
        iconsGrid.appendChild(iconBtn);
      });
    };
    
    searchInput.addEventListener("input", (e) => {
      const search = (e.target as HTMLInputElement).value.toLowerCase();
      filteredIcons = Object.entries(iconsLibrary).filter(([name]) => 
        name.toLowerCase().includes(search)
      );
      renderIcons();
    });
    
    renderIcons();
    iconsSection.appendChild(iconsGrid);
    host.appendChild(iconsSection);
  } else if (tabId === "tools") {
    // Onglet Outils Avancés
    const toolsAdvancedSection = doc.createElement("div");
    toolsAdvancedSection.className = "icontrol-editor-section";
    toolsAdvancedSection.innerHTML = `
      <div class="icontrol-editor-section-title">🔧 Outils Avancés</div>
      
      <div class="icontrol-editor-input-group">
        <label class="icontrol-editor-label">🔍 Recherche d'éléments</label>
        <div style="display:flex;gap:4px;">
          <input type="text" id="search-elements-input" placeholder="Rechercher par ID, classe ou texte..." class="icontrol-editor-input" style="flex:1;" />
          <button id="search-elements-btn" style="padding:8px 12px;background:#007AFF;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;">
            🔍
          </button>
        </div>
        <div id="search-results" style="margin-top:8px;max-height:150px;overflow-y:auto;"></div>
      </div>
      
      <div class="icontrol-editor-input-group">
        <label class="icontrol-editor-label">📊 Historique Visuel</label>
        <div id="history-timeline" style="max-height:200px;overflow-y:auto;border:1px solid #ddd;border-radius:6px;padding:8px;background:#fff;">
          <!-- Timeline sera générée ici -->
        </div>
        <div style="display:flex;gap:4px;margin-top:8px;">
          <button id="history-prev" style="flex:1;padding:6px;background:#f0f0f0;border:1px solid #ddd;border-radius:6px;cursor:pointer;font-size:12px;">← Précédent</button>
          <button id="history-next" style="flex:1;padding:6px;background:#f0f0f0;border:1px solid #ddd;border-radius:6px;cursor:pointer;font-size:12px;">Suivant →</button>
        </div>
      </div>
      
      <div class="icontrol-editor-input-group">
        <label class="icontrol-editor-label">💾 Export/Import de Styles</label>
        <div style="display:flex;gap:4px;flex-direction:column;">
          <button id="export-styles-btn" style="padding:8px;background:#4CAF50;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;">
            📤 Exporter les styles
          </button>
          <button id="import-styles-btn" style="padding:8px;background:#FF9800;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;">
            📥 Importer les styles
          </button>
          <input type="file" id="import-styles-file" accept=".json" style="display:none;" />
        </div>
      </div>
      
      <div class="icontrol-editor-input-group">
        <label class="icontrol-editor-label">📋 Templates Prédéfinis</label>
        <select id="template-select" class="icontrol-editor-select" style="margin-bottom:8px;">
          <option value="">Sélectionner un template...</option>
          <option value="card-simple">Carte Simple</option>
          <option value="card-with-header">Carte avec En-tête</option>
          <option value="form-basic">Formulaire Basique</option>
          <option value="table-dashboard">Tableau Dashboard</option>
          <option value="hero-section">Section Hero</option>
          <option value="button-group">Groupe de Boutons</option>
        </select>
        <button id="apply-template-btn" style="width:100%;padding:8px;background:#007AFF;color:white;border:none;border-radius:6px;cursor:pointer;font-size:12px;">
          ✨ Appliquer le template
        </button>
      </div>
      
      <div class="icontrol-editor-input-group">
        <label class="icontrol-editor-label">⌨️ Raccourcis Clavier</label>
        <div id="shortcuts-list" style="max-height:200px;overflow-y:auto;border:1px solid #ddd;border-radius:6px;padding:8px;background:#fff;font-size:11px;">
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0f0f0;">
            <span>Ctrl+Z</span><span>Annuler</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0f0f0;">
            <span>Ctrl+Y</span><span>Refaire</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0f0f0;">
            <span>Ctrl+C</span><span>Copier</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0f0f0;">
            <span>Ctrl+V</span><span>Coller</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0f0f0;">
            <span>Ctrl+D</span><span>Dupliquer</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0f0f0;">
            <span>Ctrl+A</span><span>Sélectionner tout</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0f0f0;">
            <span>Ctrl+S</span><span>Sauvegarder</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0f0f0;">
            <span>Del/Backspace</span><span>Supprimer</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #f0f0f0;">
            <span>Flèches</span><span>Déplacer (1px)</span>
          </div>
          <div style="display:flex;justify-content:space-between;padding:4px 0;">
            <span>Shift+Flèches</span><span>Déplacer (10px)</span>
          </div>
        </div>
        <button id="customize-shortcuts-btn" style="width:100%;margin-top:8px;padding:6px;background:#f0f0f0;border:1px solid #ddd;border-radius:6px;cursor:pointer;font-size:11px;">
          ⚙️ Personnaliser les raccourcis
        </button>
      </div>
      
      <div class="icontrol-editor-input-group">
        <label class="icontrol-editor-label">📐 Grille et Guides</label>
        <div style="display:flex;gap:4px;flex-direction:column;">
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;">
            <input type="checkbox" id="toggle-grid" checked />
            <span>Afficher la grille</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;">
            <input type="checkbox" id="toggle-guides" />
            <span>Afficher les guides d'alignement</span>
          </label>
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;">
            <input type="checkbox" id="snap-to-grid" />
            <span>Aligner sur la grille</span>
          </label>
          <div style="margin-top:8px;">
            <label style="font-size:11px;color:#666;">Taille de grille (px)</label>
            <input type="number" id="grid-size" value="10" min="5" max="50" class="icontrol-editor-input" style="width:100%;" />
          </div>
        </div>
      </div>
    `;
    host.appendChild(toolsAdvancedSection);

    // Fonctionnalités avancées - Event listeners
    setTimeout(() => {
      // Recherche d'éléments
      const searchInput = doc.getElementById("search-elements-input") as HTMLInputElement;
      const searchBtn = doc.getElementById("search-elements-btn") as HTMLButtonElement;
      const searchResults = doc.getElementById("search-results") as HTMLElement;
      
      const performSearch = () => {
        const query = searchInput.value.toLowerCase().trim();
        if (!query) {
          searchResults.innerHTML = "";
          return;
        }
        
        const mainContent = doc.getElementById("icontrol-editor-main-content") || doc.body;
        const allElements = mainContent.querySelectorAll("*");
        const results: HTMLElement[] = [];
        
        allElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl.closest("#icontrol-editor-panel")) return;
          
          const id = (htmlEl.id || "").toLowerCase();
          const classes = (htmlEl.className || "").toLowerCase();
          const text = (htmlEl.textContent || "").toLowerCase();
          
          if (id.includes(query) || classes.includes(query) || text.includes(query)) {
            results.push(htmlEl);
          }
        });
        
        if (results.length === 0) {
          searchResults.innerHTML = "<div style='padding:8px;color:#999;font-size:11px;'>Aucun résultat trouvé</div>";
          return;
        }
        
        searchResults.innerHTML = results.slice(0, 10).map((el, idx) => {
          const tag = el.tagName.toLowerCase();
          const id = el.id || "sans-id";
          const classes = el.className || "sans-classe";
          return `
            <div style="padding:6px;border-bottom:1px solid #f0f0f0;cursor:pointer;font-size:11px;" data-result-index="${idx}">
              <div style="font-weight:600;">${tag} #${id}</div>
              <div style="color:#666;font-size:10px;">.${classes.split(' ').join(' .')}</div>
            </div>
          `;
        }).join("");
        
        searchResults.querySelectorAll("[data-result-index]").forEach((item, idx) => {
          item.addEventListener("click", () => {
            const targetEl = results[idx];
            targetEl.setAttribute("data-selected", "true");
            targetEl.scrollIntoView({ behavior: "smooth", block: "center" });
            popup.icontrolEditor?.enableEditMode();
            popup.dispatchEvent(new CustomEvent("icontrol-editor-select"));
          });
        });
      };
      
      searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") performSearch();
      });
      searchBtn.addEventListener("click", performSearch);

      // Historique visuel
      const historyTimeline = doc.getElementById("history-timeline") as HTMLElement;
      const historyPrev = doc.getElementById("history-prev") as HTMLButtonElement;
      const historyNext = doc.getElementById("history-next") as HTMLButtonElement;
      
      const renderHistory = () => {
        const undoStack = (popup as any).__undoStack || [];
        const redoStack = (popup as any).__redoStack || [];
        const history = [...undoStack].reverse();
        
        if (history.length === 0) {
          historyTimeline.innerHTML = "<div style='padding:8px;color:#999;font-size:11px;'>Aucun historique</div>";
          return;
        }
        
        historyTimeline.innerHTML = history.slice(0, 10).map((state: any, idx: number) => {
          const date = new Date(state.timestamp);
          return `
            <div style="padding:4px 8px;border-left:3px solid #007AFF;margin-bottom:4px;font-size:11px;">
              <div style="font-weight:600;">${state.action || "Action"}</div>
              <div style="color:#666;font-size:10px;">${date.toLocaleTimeString()}</div>
            </div>
          `;
        }).join("");
      };
      
      setInterval(renderHistory, 1000);
      historyPrev.addEventListener("click", () => {
        if (popup.icontrolEditor?.undo) popup.icontrolEditor.undo();
      });
      historyNext.addEventListener("click", () => {
        if (popup.icontrolEditor?.redo) popup.icontrolEditor.redo();
      });

      // Export/Import de styles
      const exportStylesBtn = doc.getElementById("export-styles-btn") as HTMLButtonElement;
      const importStylesBtn = doc.getElementById("import-styles-btn") as HTMLButtonElement;
      const importStylesFile = doc.getElementById("import-styles-file") as HTMLInputElement;
      
      exportStylesBtn.addEventListener("click", () => {
        const selected = popup.icontrolEditor?.getSelectedElement();
        if (!selected) {
          popup.alert("Veuillez sélectionner un élément pour exporter ses styles.");
          return;
        }
        
        const styles: Record<string, string> = {};
        const computedStyle = popup.getComputedStyle(selected);
        Array.from(computedStyle).forEach((prop) => {
          styles[prop] = computedStyle.getPropertyValue(prop);
        });
        
        const dataStr = JSON.stringify({ elementId: selected.id, styles }, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = doc.createElement("a");
        a.href = url;
        a.download = `styles_${selected.id}_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
      });
      
      importStylesBtn.addEventListener("click", () => {
        importStylesFile.click();
      });
      
      importStylesFile.addEventListener("change", (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (ev) => {
          try {
            const data = JSON.parse(ev.target?.result as string);
            const targetEl = doc.getElementById(data.elementId);
            if (targetEl && data.styles) {
              Object.entries(data.styles).forEach(([prop, value]) => {
                (targetEl.style as any)[prop] = value;
              });
              popup.dispatchEvent(new CustomEvent("icontrol-editor-select"));
              popup.alert("Styles importés avec succès !");
            }
          } catch (e) {
            popup.alert("Erreur lors de l'import des styles.");
          }
        };
        reader.readAsText(file);
      });

      // Templates prédéfinis
      const templateSelect = doc.getElementById("template-select") as HTMLSelectElement;
      const applyTemplateBtn = doc.getElementById("apply-template-btn") as HTMLButtonElement;
      
      const templates: Record<string, () => HTMLElement> = {
        "card-simple": () => {
          const card = doc.createElement("div");
          card.className = "template-card";
          card.style.cssText = "padding:20px;border:1px solid #ddd;border-radius:12px;background:#fff;margin:8px;box-shadow:0 2px 8px rgba(0,0,0,0.1);";
          card.innerHTML = "<h3>Titre de la carte</h3><p>Contenu de la carte...</p>";
          return card;
        },
        "card-with-header": () => {
          const card = doc.createElement("div");
          card.className = "template-card-header";
          card.style.cssText = "border:1px solid #ddd;border-radius:12px;background:#fff;margin:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.1);";
          card.innerHTML = "<div style='padding:12px 20px;background:#007AFF;color:white;font-weight:600;'>En-tête</div><div style='padding:20px;'><p>Contenu...</p></div>";
          return card;
        },
        "form-basic": () => {
          const form = doc.createElement("form");
          form.className = "template-form";
          form.style.cssText = "padding:20px;border:1px solid #ddd;border-radius:12px;background:#fff;margin:8px;";
          form.innerHTML = `
            <div style="margin-bottom:16px;">
              <label style="display:block;margin-bottom:4px;font-weight:600;">Nom</label>
              <input type="text" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;" />
            </div>
            <div style="margin-bottom:16px;">
              <label style="display:block;margin-bottom:4px;font-weight:600;">Email</label>
              <input type="email" style="width:100%;padding:8px;border:1px solid #ddd;border-radius:6px;" />
            </div>
            <button type="submit" style="padding:8px 16px;background:#007AFF;color:white;border:none;border-radius:6px;cursor:pointer;">Envoyer</button>
          `;
          return form;
        },
        "table-dashboard": () => {
          const table = doc.createElement("table");
          table.style.cssText = "width:100%;border-collapse:collapse;margin:8px;";
          table.innerHTML = `
            <tr style="background:#f5f5f5;">
              <th style="padding:10px;border:1px solid #ddd;text-align:left;">Colonne 1</th>
              <th style="padding:10px;border:1px solid #ddd;text-align:left;">Colonne 2</th>
              <th style="padding:10px;border:1px solid #ddd;text-align:left;">Colonne 3</th>
            </tr>
            <tr><td style="padding:10px;border:1px solid #ddd;">Donnée 1</td><td style="padding:10px;border:1px solid #ddd;">Donnée 2</td><td style="padding:10px;border:1px solid #ddd;">Donnée 3</td></tr>
            <tr><td style="padding:10px;border:1px solid #ddd;">Donnée 4</td><td style="padding:10px;border:1px solid #ddd;">Donnée 5</td><td style="padding:10px;border:1px solid #ddd;">Donnée 6</td></tr>
          `;
          return table;
        },
        "hero-section": () => {
          const hero = doc.createElement("section");
          hero.className = "template-hero";
          hero.style.cssText = "padding:60px 20px;text-align:center;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;margin:8px;border-radius:12px;";
          hero.innerHTML = "<h1 style='font-size:2.5em;margin-bottom:16px;'>Titre Principal</h1><p style='font-size:1.2em;opacity:0.9;'>Description de la section hero</p>";
          return hero;
        },
        "button-group": () => {
          const group = doc.createElement("div");
          group.className = "template-button-group";
          group.style.cssText = "display:flex;gap:8px;padding:20px;";
          group.innerHTML = `
            <button style="padding:10px 20px;background:#007AFF;color:white;border:none;border-radius:6px;cursor:pointer;">Bouton 1</button>
            <button style="padding:10px 20px;background:#4CAF50;color:white;border:none;border-radius:6px;cursor:pointer;">Bouton 2</button>
            <button style="padding:10px 20px;background:#FF9800;color:white;border:none;border-radius:6px;cursor:pointer;">Bouton 3</button>
          `;
          return group;
        }
      };
      
      applyTemplateBtn.addEventListener("click", () => {
        const templateId = templateSelect.value;
        if (!templateId || !templates[templateId]) {
          popup.alert("Veuillez sélectionner un template.");
          return;
        }
        
        const mainContent = doc.getElementById("icontrol-editor-main-content");
        if (!mainContent) return;
        
        const newElement = templates[templateId]();
        newElement.id = `template_${templateId}_${Date.now()}`;
        newElement.setAttribute("data-editable-highlight", "true");
        mainContent.appendChild(newElement);
        popup.dispatchEvent(new CustomEvent("icontrol-editor-select"));
      });

      // Grille et guides
      let gridVisible = true;
      let guidesVisible = false;
      let snapToGrid = false;
      let gridSize = 10;
      
      const toggleGrid = doc.getElementById("toggle-grid") as HTMLInputElement;
      const toggleGuides = doc.getElementById("toggle-guides") as HTMLInputElement;
      const snapToGridCheck = doc.getElementById("snap-to-grid") as HTMLInputElement;
      const gridSizeInput = doc.getElementById("grid-size") as HTMLInputElement;
      
      const createGrid = () => {
        let gridEl = doc.getElementById("editor-grid-overlay");
        if (!gridEl) {
          gridEl = doc.createElement("div");
          gridEl.id = "editor-grid-overlay";
          gridEl.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 9999;
            background-image: linear-gradient(to right, rgba(0,122,255,0.1) 1px, transparent 1px),
                              linear-gradient(to bottom, rgba(0,122,255,0.1) 1px, transparent 1px);
            background-size: ${gridSize}px ${gridSize}px;
            opacity: 0.3;
          `;
          doc.body.appendChild(gridEl);
        }
        gridEl.style.display = gridVisible ? "block" : "none";
        gridEl.style.backgroundSize = `${gridSize}px ${gridSize}px`;
      };
      
      toggleGrid.addEventListener("change", (e) => {
        gridVisible = (e.target as HTMLInputElement).checked;
        createGrid();
      });
      
      toggleGuides.addEventListener("change", (e) => {
        guidesVisible = (e.target as HTMLInputElement).checked;
      });
      
      snapToGridCheck.addEventListener("change", (e) => {
        snapToGrid = (e.target as HTMLInputElement).checked;
      });
      
      gridSizeInput.addEventListener("change", (e) => {
        gridSize = parseInt((e.target as HTMLInputElement).value) || 10;
        createGrid();
      });
      
      createGrid();
    }, 100);
  }
}

// Fonction utilitaire pour convertir RGB en hex
function rgbToHex(rgb: string): string {
  if (!rgb || rgb === "transparent" || rgb === "rgba(0, 0, 0, 0)") return "#ffffff";
  const match = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);
  if (!match) return "#000000";
  const r = parseInt(match[1], 10);
  const g = parseInt(match[2], 10);
  const b = parseInt(match[3], 10);
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}
