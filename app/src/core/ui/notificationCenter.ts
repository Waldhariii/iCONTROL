/**
 * ICONTROL_NOTIFICATION_CENTER_V1
 * Centre de notifications avec badge et historique
 */

export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
}

class NotificationManager {
  private notifications: Notification[] = [];
  private listeners: Array<(notifications: Notification[]) => void> = [];
  private maxNotifications = 50;

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notify() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  add(notification: Omit<Notification, "id" | "timestamp" | "read">) {
    const newNotification: Notification = {
      ...notification,
      id: `notif-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      read: false
    };

    this.notifications.unshift(newNotification);
    if (this.notifications.length > this.maxNotifications) {
      this.notifications = this.notifications.slice(0, this.maxNotifications);
    }

    this.saveToStorage();
    this.notify();
  }

  markAsRead(id: string) {
    const notif = this.notifications.find(n => n.id === id);
    if (notif) {
      notif.read = true;
      this.saveToStorage();
      this.notify();
    }
  }

  markAllAsRead() {
    this.notifications.forEach(n => n.read = true);
    this.saveToStorage();
    this.notify();
  }

  remove(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveToStorage();
    this.notify();
  }

  clear() {
    this.notifications = [];
    this.saveToStorage();
    this.notify();
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  getAll(): Notification[] {
    return [...this.notifications];
  }

  private saveToStorage() {
    try {
      localStorage.setItem("icontrol_notifications", JSON.stringify(
        this.notifications.map(n => ({
          ...n,
          timestamp: n.timestamp.toISOString()
        }))
      ));
    } catch (e) {
      console.warn("Failed to save notifications to storage", e);
    }
  }

  loadFromStorage() {
    try {
      const stored = localStorage.getItem("icontrol_notifications");
      if (stored) {
        this.notifications = JSON.parse(stored).map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
          read: n.read || false
        }));
        this.notify();
      }
    } catch (e) {
      console.warn("Failed to load notifications from storage", e);
    }
  }
}

export const notificationManager = new NotificationManager();

export function createNotificationCenter(): {
  button: HTMLElement;
  dropdown: HTMLElement;
} {
  // Bouton avec badge
  const button = document.createElement("button");
  button.style.cssText = `
    position: relative;
    padding: 8px;
    background: transparent;
    border: 1px solid var(--ic-border, #2b3136);
    border-radius: 6px;
    color: var(--ic-text, #e7ecef);
    cursor: pointer;
    font-size: 18px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  `;
  button.innerHTML = "🔔";

  const badge = document.createElement("div");
  badge.style.minWidth = "0";
  badge.style.boxSizing = "border-box";
  badge.style.cssText = `
    position: absolute;
    top: -4px;
    right: -4px;
    background: #f48771;
    color: white;
    border-radius: 10px;
    padding: 2px 6px;
    font-size: 10px;
    font-weight: 700;
    min-width: 18px;
    text-align: center;
    display: none;
  `;
  button.appendChild(badge);

  // Dropdown (positionnement fixe calculé dynamiquement)
  const dropdown = document.createElement("div");
  dropdown.style.cssText = `
    position: fixed;
    top: 56px;
    right: 16px;
    width: 360px;
    max-width: calc(100vw - 32px);
    max-height: calc(100vh - 80px);
    background: var(--ic-card, #1a1d1f);
    border: 1px solid var(--ic-border, #2b3136);
    border-radius: 8px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.4);
    z-index: 10001;
    display: none;
    flex-direction: column;
    overflow: hidden;
  `;

  // Header
  const header = document.createElement("div");
  header.style.cssText = `
    padding: 12px 16px;
    border-bottom: 1px solid var(--ic-border, #2b3136);
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;

  const headerTitle = document.createElement("div");
  headerTitle.style.cssText = "font-size: 14px; font-weight: 600; color: var(--ic-text, #e7ecef);";
  headerTitle.textContent = "Notifications";
  header.appendChild(headerTitle);

  const markAllReadBtn = document.createElement("button");
  markAllReadBtn.textContent = "Tout marquer lu";
  markAllReadBtn.style.cssText = `
    padding: 4px 8px;
    background: transparent;
    border: 1px solid var(--ic-border, #2b3136);
    color: var(--ic-text, #e7ecef);
    border-radius: 4px;
    cursor: pointer;
    font-size: 11px;
    transition: all 0.2s;
  `;
  markAllReadBtn.onmouseenter = () => { markAllReadBtn.style.background = "rgba(255,255,255,0.05)"; };
  markAllReadBtn.onmouseleave = () => { markAllReadBtn.style.background = "transparent"; };
  markAllReadBtn.onclick = () => {
    notificationManager.markAllAsRead();
  };
  header.appendChild(markAllReadBtn);

  dropdown.appendChild(header);

  // Liste des notifications
  const list = document.createElement("div");
  list.style.cssText = `
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
  `;
  dropdown.appendChild(list);

  // Footer
  const footer = document.createElement("div");
  footer.style.cssText = `
    padding: 8px 16px;
    border-top: 1px solid var(--ic-border, #2b3136);
    text-align: center;
  `;
  const clearBtn = document.createElement("button");
  clearBtn.textContent = "Effacer tout";
  clearBtn.style.cssText = `
    padding: 6px 12px;
    background: transparent;
    border: 1px solid var(--ic-border, #2b3136);
    color: var(--ic-text, #e7ecef);
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    transition: all 0.2s;
  `;
  clearBtn.onmouseenter = () => { clearBtn.style.background = "rgba(255,255,255,0.05)"; };
  clearBtn.onmouseleave = () => { clearBtn.style.background = "transparent"; };
  clearBtn.onclick = () => {
    if (confirm("Effacer toutes les notifications ?")) {
      notificationManager.clear();
    }
  };
  footer.appendChild(clearBtn);
  dropdown.appendChild(footer);

  const renderNotifications = (notifications: Notification[]) => {
    list.innerHTML = "";

    if (notifications.length === 0) {
      const empty = document.createElement("div");
      empty.style.cssText = "padding: 40px 20px; text-align: center; color: var(--ic-mutedText, #a7b0b7); font-size: 13px;";
      empty.textContent = "Aucune notification";
      list.appendChild(empty);
      return;
    }

    const colors = {
      info: { bg: "rgba(59,130,246,0.15)", border: "#3b82f6", icon: "ℹ️" },
      success: { bg: "rgba(78,201,176,0.15)", border: "#4ec9b0", icon: "✅" },
      warning: { bg: "rgba(220,220,170,0.15)", border: "#dcdcaa", icon: "⚠️" },
      error: { bg: "rgba(244,135,113,0.15)", border: "#f48771", icon: "❌" }
    };

    notifications.forEach(notif => {
      const item = document.createElement("div");
      const color = colors[notif.type];
      item.style.cssText = `
        padding: 12px 16px;
        border-bottom: 1px solid var(--ic-border, #2b3136);
        border-left: 3px solid ${notif.read ? "transparent" : color.border};
        background: ${notif.read ? "transparent" : color.bg};
        cursor: pointer;
        transition: all 0.15s;
      `;

      const icon = document.createElement("span");
      icon.textContent = color.icon;
      icon.style.cssText = "font-size: 16px; margin-right: 8px;";

      const content = document.createElement("div");
      content.style.cssText = "flex: 1; display: flex; flex-direction: column; gap: 4px;";

      const title = document.createElement("div");
      title.style.cssText = `
        color: var(--ic-text, #e7ecef);
        font-size: 13px;
        font-weight: ${notif.read ? "400" : "600"};
      `;
      title.textContent = notif.title;
      content.appendChild(title);

      const message = document.createElement("div");
      message.style.cssText = "color: var(--ic-mutedText, #a7b0b7); font-size: 12px;";
      message.textContent = notif.message;
      content.appendChild(message);

      const time = document.createElement("div");
      time.style.cssText = "color: var(--ic-mutedText, #a7b0b7); font-size: 10px; margin-top: 4px;";
      const now = new Date();
      const diff = now.getTime() - notif.timestamp.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      if (minutes < 1) time.textContent = "À l'instant";
      else if (minutes < 60) time.textContent = `Il y a ${minutes} min`;
      else if (hours < 24) time.textContent = `Il y a ${hours}h`;
      else time.textContent = `Il y a ${days} jour(s)`;
      content.appendChild(time);

      if (notif.action) {
        const actionBtn = document.createElement("button");
        actionBtn.textContent = notif.action.label;
        actionBtn.style.cssText = `
          margin-top: 8px;
          padding: 4px 8px;
          background: var(--ic-panel, #37373d);
          border: 1px solid var(--ic-border, #2b3136);
          color: var(--ic-text, #e7ecef);
          border-radius: 4px;
          cursor: pointer;
          font-size: 11px;
          align-self: flex-start;
        `;
        actionBtn.onclick = (e) => {
          e.stopPropagation();
          notif.action!.onClick();
        };
        content.appendChild(actionBtn);
      }

      item.onclick = () => {
        notificationManager.markAsRead(notif.id);
        if (notif.action) {
          notif.action.onClick();
        }
      };

      item.onmouseenter = () => {
        item.style.background = "rgba(255,255,255,0.05)";
      };
      item.onmouseleave = () => {
        item.style.background = notif.read ? "transparent" : color.bg;
      };

      const container = document.createElement("div");
      container.style.cssText = "display: flex; align-items: flex-start;";
      container.appendChild(icon);
      container.appendChild(content);
      item.appendChild(container);
      list.appendChild(item);
    });
  };

  const updateBadge = () => {
    const count = notificationManager.getUnreadCount();
    if (count > 0) {
      badge.textContent = count > 99 ? "99+" : String(count);
      badge.style.display = "block";
    } else {
      badge.style.display = "none";
    }
  };

  // Toggle dropdown avec positionnement dynamique
  let isOpen = false;
  let scrollHandler: (() => void) | null = null;
  let resizeHandler: (() => void) | null = null;
  
  const updateDropdownPosition = () => {
    const rect = button.getBoundingClientRect();
    dropdown.style.top = `${rect.bottom + 8}px`;
    dropdown.style.right = `${window.innerWidth - rect.right}px`;
  };
  
  const cleanupListeners = () => {
    if (scrollHandler) {
      window.removeEventListener("scroll", scrollHandler, true);
      scrollHandler = null;
    }
    if (resizeHandler) {
      window.removeEventListener("resize", resizeHandler);
      resizeHandler = null;
    }
  };
  
  button.onclick = (e) => {
    e.stopPropagation();
    isOpen = !isOpen;
    if (isOpen) {
      updateDropdownPosition();
      dropdown.style.display = "flex";
      // Mettre à jour position au scroll/resize
      scrollHandler = updateDropdownPosition;
      resizeHandler = updateDropdownPosition;
      window.addEventListener("scroll", scrollHandler, true);
      window.addEventListener("resize", resizeHandler);
    } else {
      dropdown.style.display = "none";
      cleanupListeners();
    }
  };

  // Fermer en cliquant ailleurs
  document.addEventListener("click", (e) => {
    if (isOpen && !button.contains(e.target as Node) && !dropdown.contains(e.target as Node)) {
      isOpen = false;
      dropdown.style.display = "none";
      cleanupListeners();
    }
  });

  // Mettre à jour l'UI quand notifications changent
  notificationManager.subscribe((notifications) => {
    renderNotifications(notifications);
    updateBadge();
  });

  // Charger depuis storage
  notificationManager.loadFromStorage();
  renderNotifications(notificationManager.getAll());
  updateBadge();

  // Créer un container pour le positionnement (PROFESSIONNEL)
  const container = document.createElement("div");
  container.style.cssText = `
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  `;
  container.appendChild(button);
  container.appendChild(dropdown);

  return { button: container, dropdown };
}
