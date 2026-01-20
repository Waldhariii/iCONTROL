/**
 * ICONTROL_DRAG_DROP_V1
 * Système de drag & drop pour widgets personnalisables
 */

export interface DraggableItem {
  id: string;
  element: HTMLElement;
  data?: any;
}

export interface DropZone {
  id: string;
  element: HTMLElement;
  accept?: (item: DraggableItem) => boolean;
  onDrop?: (item: DraggableItem) => void;
}

class DragDropManager {
  private draggedItem: DraggableItem | null = null;
  private dropZones: Map<string, DropZone> = new Map();
  private draggables: Map<string, DraggableItem> = new Map();

  makeDraggable(item: DraggableItem): () => void {
    this.draggables.set(item.id, item);
    
    item.element.setAttribute("draggable", "true");
    item.element.setAttribute("data-drag-id", item.id);
    
    item.element.style.cursor = "grab";
    item.element.style.userSelect = "none";

    item.element.addEventListener("dragstart", (e) => {
      this.draggedItem = item;
      item.element.style.opacity = "0.5";
      item.element.style.cursor = "grabbing";
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("text/plain", item.id);
      }
    });

    item.element.addEventListener("dragend", () => {
      item.element.style.opacity = "1";
      item.element.style.cursor = "grab";
      this.draggedItem = null;
    });

    return () => {
      item.element.removeAttribute("draggable");
      item.element.removeAttribute("data-drag-id");
      this.draggables.delete(item.id);
    };
  }

  makeDropZone(zone: DropZone): () => void {
    this.dropZones.set(zone.id, zone);
    
    zone.element.setAttribute("data-drop-zone", zone.id);

    zone.element.addEventListener("dragover", (e) => {
      e.preventDefault();
      if (this.draggedItem && (!zone.accept || zone.accept(this.draggedItem))) {
        e.dataTransfer!.dropEffect = "move";
        zone.element.style.background = "rgba(59, 130, 246, 0.1)";
        zone.element.style.borderColor = "#3b82f6";
      } else {
        e.dataTransfer!.dropEffect = "none";
      }
    });

    zone.element.addEventListener("dragleave", () => {
      zone.element.style.background = "";
      zone.element.style.borderColor = "";
    });

    zone.element.addEventListener("drop", (e) => {
      e.preventDefault();
      zone.element.style.background = "";
      zone.element.style.borderColor = "";

      if (this.draggedItem && (!zone.accept || zone.accept(this.draggedItem))) {
        if (zone.onDrop) {
          zone.onDrop(this.draggedItem);
        }
      }
    });

    return () => {
      zone.element.removeAttribute("data-drop-zone");
      this.dropZones.delete(zone.id);
    };
  }

  clear() {
    this.draggables.clear();
    this.dropZones.clear();
    this.draggedItem = null;
  }
}

export const dragDropManager = new DragDropManager();
