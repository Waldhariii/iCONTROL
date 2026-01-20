/**
 * ICONTROL_VISUAL_EDITOR_ENHANCED_V1
 * Fonctionnalités avancées pour l'éditeur visuel
 * - Undo/Redo
 * - Édition inline de texte
 * - Copier/Coller/Dupliquer
 * - Multi-sélection
 * - Bibliothèque d'icônes
 */

/**
 * Bibliothèque complète d'icônes (Unicode/Emoji)
 */
export const ICON_LIBRARY = {
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
  // Arrows & Directions
  chevronLeft: "‹", chevronRight: "›", chevronUp: "‥", chevronDown: "‥",
  // Shapes
  circle: "⚪", square: "⬜", triangle: "▲", diamond: "♦",
  // Other
  clock: "🕐", calendar: "📅", location: "📍", tag: "🏷️", filter: "🔍", grid: "⊞", list: "☰",
  // Custom/Common UI
  bell: "🔔", bookmark: "🔖", flag: "🚩", fire: "🔥", lightbulb: "💡", key: "🔑", gear: "⚙️",
  cart: "🛒", shopping: "🛍️", gift: "🎁", trophy: "🏆", medal: "🏅", certificate: "📜"
};

/**
 * Système Undo/Redo
 */
export class UndoRedoManager {
  private undoStack: Array<() => void> = [];
  private redoStack: Array<() => void> = [];
  private maxHistory = 50;

  saveState(getState: () => any, applyState: (state: any) => void): void {
    const currentState = getState();
    this.undoStack.push(() => {
      const previousState = getState();
      applyState(currentState);
      this.redoStack.push(() => {
        const newState = getState();
        applyState(previousState);
        this.undoStack.push(() => saveState(getState, applyState));
      });
    });

    // Limiter la taille de l'historique
    if (this.undoStack.length > this.maxHistory) {
      this.undoStack.shift();
    }

    // Vider le redo quand une nouvelle action est effectuée
    this.redoStack = [];
  }

  undo(): boolean {
    if (this.undoStack.length === 0) return false;
    const action = this.undoStack.pop();
    if (action) action();
    return true;
  }

  redo(): boolean {
    if (this.redoStack.length === 0) return false;
    const action = this.redoStack.pop();
    if (action) action();
    return true;
  }

  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  clear(): void {
    this.undoStack = [];
    this.redoStack = [];
  }
}

/**
 * Système de copier/coller
 */
export class ClipboardManager {
  private clipboard: { element: HTMLElement; html: string } | null = null;

  copy(element: HTMLElement): void {
    this.clipboard = {
      element: element.cloneNode(true) as HTMLElement,
      html: element.outerHTML
    };
  }

  paste(parent: HTMLElement, position?: number): HTMLElement | null {
    if (!this.clipboard) return null;
    const cloned = this.clipboard.element.cloneNode(true) as HTMLElement;
    
    // Générer un nouvel ID si nécessaire
    if (cloned.id) {
      cloned.id = `${cloned.id}_copy_${Date.now()}`;
    }
    
    // Retirer les attributs data-selected, etc.
    cloned.removeAttribute("data-selected");
    cloned.removeAttribute("data-editable-highlight");
    
    if (position !== undefined && position >= 0 && position < parent.children.length) {
      parent.insertBefore(cloned, parent.children[position]);
    } else {
      parent.appendChild(cloned);
    }
    
    return cloned;
  }

  duplicate(element: HTMLElement): HTMLElement | null {
    if (!element.parentElement) return null;
    this.copy(element);
    const index = Array.from(element.parentElement.children).indexOf(element);
    return this.paste(element.parentElement, index + 1);
  }

  hasContent(): boolean {
    return this.clipboard !== null;
  }

  clear(): void {
    this.clipboard = null;
  }
}

/**
 * Gestionnaire de multi-sélection
 */
export class MultiSelectionManager {
  private selectedElements: Set<HTMLElement> = new Set();

  select(element: HTMLElement, add: boolean = false): void {
    if (!add) {
      this.clear();
    }
    this.selectedElements.add(element);
    element.setAttribute("data-selected", "true");
  }

  deselect(element: HTMLElement): void {
    this.selectedElements.delete(element);
    element.removeAttribute("data-selected");
  }

  clear(): void {
    this.selectedElements.forEach(el => el.removeAttribute("data-selected"));
    this.selectedElements.clear();
  }

  getSelected(): HTMLElement[] {
    return Array.from(this.selectedElements);
  }

  hasSelected(): boolean {
    return this.selectedElements.size > 0;
  }

  count(): number {
    return this.selectedElements.size;
  }

  applyToAll(callback: (el: HTMLElement) => void): void {
    this.selectedElements.forEach(callback);
  }
}

/**
 * Édition inline de texte
 */
export function enableInlineEditing(element: HTMLElement, onSave: (newText: string) => void): void {
  if (!element || element.closest("#icontrol-editor-panel")) return;

  const originalText = element.textContent || "";
  const isTextElement = /^(h[1-6]|p|span|div|label|td|th|li|a|button|strong|em|b|i)$/i.test(element.tagName);

  if (!isTextElement && element.children.length > 0) {
    // Élément avec enfants - éditer seulement le contenu texte direct
    return;
  }

  // Créer un input/textarea pour l'édition
  const isLongText = originalText.length > 50 || element.tagName.toLowerCase() === "textarea";
  const editor = isLongText ? document.createElement("textarea") : document.createElement("input");
  
  if (editor instanceof HTMLInputElement) {
    editor.type = "text";
  }

  const rect = element.getBoundingClientRect();
  const styles = window.getComputedStyle(element);

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
      onSave(editor.value);
    }
    document.body.removeChild(editor);
    element.style.opacity = "1";
  };

  editor.onblur = () => finish(true);
  editor.onkeydown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !(editor instanceof HTMLTextAreaElement)) {
      e.preventDefault();
      finish(true);
    } else if (e.key === "Escape") {
      e.preventDefault();
      finish(false);
    }
  };

  element.style.opacity = "0.5";
  document.body.appendChild(editor);
  editor.focus();
  editor.select();
}

/**
 * Convertit RGB/RGBA en hexadécimal
 */
export function rgbToHex(rgb: string): string {
  if (!rgb || rgb === "transparent" || rgb === "rgba(0, 0, 0, 0)") return "#ffffff";
  
  // RGBA
  const rgbaMatch = rgb.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)$/);
  if (rgbaMatch) {
    const r = parseInt(rgbaMatch[1], 10);
    const g = parseInt(rgbaMatch[2], 10);
    const b = parseInt(rgbaMatch[3], 10);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }
  
  // HEX direct
  if (rgb.startsWith("#")) return rgb;
  
  return "#000000";
}

/**
 * Applique des styles CSS de manière sécurisée
 */
export function applyStyles(element: HTMLElement, styles: Record<string, string>): void {
  Object.entries(styles).forEach(([prop, value]) => {
    try {
      (element.style as any)[prop] = value;
    } catch (e) {
      console.warn(`Impossible d'appliquer le style ${prop}:`, e);
    }
  });
}

/**
 * Crée un élément avec une icône
 */
export function createElementWithIcon(tagName: string, icon: string, text: string = ""): HTMLElement {
  const element = document.createElement(tagName);
  const iconSpan = document.createElement("span");
  iconSpan.textContent = icon;
  iconSpan.style.marginRight = text ? "8px" : "0";
  element.appendChild(iconSpan);
  
  if (text) {
    const textNode = document.createTextNode(text);
    element.appendChild(textNode);
  }
  
  return element;
}
