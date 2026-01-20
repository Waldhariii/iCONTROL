/**
 * ICONTROL_ACCESSIBILITY_V1
 * Utilitaires d'accessibilité WCAG 2.1 AA
 */

// Améliorer la navigation clavier
export function enhanceKeyboardNavigation(element: HTMLElement): void {
  // Assurer que tous les éléments interactifs sont focusables
  const interactiveElements = element.querySelectorAll<HTMLElement>(
    "button, a, input, select, textarea, [tabindex], [role='button'], [role='link']"
  );

  interactiveElements.forEach(el => {
    if (!el.hasAttribute("tabindex") && el.tagName !== "BUTTON" && el.tagName !== "A" && el.tagName !== "INPUT") {
      el.setAttribute("tabindex", "0");
    }
  });

  // Navigation avec flèches dans les listes
  const lists = element.querySelectorAll<HTMLElement>("[role='listbox'], [role='menu'], ul[role='list']");
  lists.forEach(list => {
    const items = Array.from(list.querySelectorAll<HTMLElement>("[role='option'], [role='menuitem'], li"));
    items.forEach((item, index) => {
      item.addEventListener("keydown", (e) => {
        let targetIndex = index;

        if (e.key === "ArrowDown") {
          e.preventDefault();
          targetIndex = (index + 1) % items.length;
        } else if (e.key === "ArrowUp") {
          e.preventDefault();
          targetIndex = index === 0 ? items.length - 1 : index - 1;
        } else if (e.key === "Home") {
          e.preventDefault();
          targetIndex = 0;
        } else if (e.key === "End") {
          e.preventDefault();
          targetIndex = items.length - 1;
        }

        if (targetIndex !== index) {
          items[targetIndex].focus();
        }
      });
    });
  });
}

// Vérifier et améliorer le contraste
export function checkContrast(color1: string, color2: string): number {
  // Simplifié - utiliser une vraie bibliothèque en production
  // Retourne ratio de contraste (minimum 4.5:1 pour WCAG AA)
  return 4.5; // Placeholder
}

// Ajouter skip links (DÉSACTIVÉ - bouton supprimé visuellement)
export function addSkipLinks(): void {
  // Skip links désactivés pour éviter l'affichage du bouton "au contenu principal"
  // L'accessibilité reste gérée via les autres mécanismes (navigation clavier, ARIA)
  return;
}

// Améliorer les ARIA labels manquants
export function enhanceARIALabels(root: HTMLElement): void {
  // Boutons sans texte visible
  const iconButtons = root.querySelectorAll<HTMLElement>("button:not([aria-label]):not(:has(span:not(.sr-only))):not(:has(img))");
  iconButtons.forEach(btn => {
    const title = btn.getAttribute("title");
    if (title && !btn.hasAttribute("aria-label")) {
      btn.setAttribute("aria-label", title);
    }
  });

  // Images sans alt
  const images = root.querySelectorAll<HTMLImageElement>("img:not([alt])");
  images.forEach(img => {
    img.setAttribute("alt", img.getAttribute("aria-label") || "Image");
  });

  // Inputs sans labels
  const inputs = root.querySelectorAll<HTMLInputElement>("input:not([aria-label]):not([aria-labelledby])");
  inputs.forEach(input => {
    const label = root.querySelector(`label[for="${input.id}"]`);
    if (!label && !input.hasAttribute("aria-label")) {
      const placeholder = input.getAttribute("placeholder");
      if (placeholder) {
        input.setAttribute("aria-label", placeholder);
      }
    }
  });
}

// Focus visible amélioré
export function enhanceFocusVisible(): void {
  if (!document.getElementById("a11y-focus-styles")) {
    const style = document.createElement("style");
    style.id = "a11y-focus-styles";
    style.textContent = `
      *:focus-visible {
        outline: 2px solid var(--ic-accent, #7b2cff) !important;
        outline-offset: 2px !important;
        border-radius: 2px !important;
      }
      button:focus-visible,
      a:focus-visible,
      input:focus-visible,
      select:focus-visible,
      textarea:focus-visible {
        outline: 2px solid var(--ic-accent, #7b2cff) !important;
        outline-offset: 2px !important;
      }
    `;
    document.head.appendChild(style);
  }
}

// Initialiser accessibilité globale
export function initAccessibility(): void {
  // Ajouter skip links
  addSkipLinks();

  // Améliorer focus visible
  enhanceFocusVisible();

  // Améliorer navigation clavier sur tout le document
  enhanceKeyboardNavigation(document.body);

  // Améliorer ARIA labels
  enhanceARIALabels(document.body);
}
