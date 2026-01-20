/**
 * ICONTROL_LOGO_MANAGER_V1
 * Gestionnaire de logos avec changement automatique selon le thème
 */
import { getBrand } from "../../../../platform-services/branding/brandService";

export function detectTheme(): "light" | "dark" {
  try {
    const stored = localStorage.getItem("icontrol_theme_mode");
    if (stored === "light" || stored === "dark") return stored;
    
    // Détecter via prefers-color-scheme
    if (typeof window !== "undefined" && window.matchMedia) {
      if (window.matchMedia("(prefers-color-scheme: light)").matches) {
        return "light";
      }
    }
    return "dark";
  } catch {
    return "dark";
  }
}

export function getLogoForTheme(theme: "light" | "dark"): string {
  try {
    const brand = getBrand();
    const brandAny = brand as any;
    
    if (theme === "light") {
      return brandAny.LOGO_LIGHT || brand.LOGO_PRIMARY || "";
    } else {
      return brandAny.LOGO_DARK || brand.LOGO_PRIMARY || "";
    }
  } catch {
    return "";
  }
}

export function updateAllLogos(theme?: "light" | "dark"): void {
  const currentTheme = theme || detectTheme();
  const logoUrl = getLogoForTheme(currentTheme);
  const brand = getBrand();
  
  // Mettre à jour tous les logos dans la page
  document.querySelectorAll<HTMLImageElement>("img[data-brand-logo]").forEach(img => {
    if (logoUrl) {
      img.src = logoUrl;
      img.style.display = "block";
      img.style.opacity = "0";
      img.style.transition = "opacity 0.3s ease-in-out";
      
      // Forcer le reflow pour que la transition fonctionne
      void img.offsetHeight;
      
      setTimeout(() => {
        img.style.opacity = "1";
      }, 10);
    } else {
      img.style.display = "none";
    }
  });
  
  // Mettre à jour le titre si pas de logo (header)
  document.querySelectorAll("#cxBrandTitle").forEach(el => {
    const titleEl = el as HTMLElement;
    if (logoUrl) {
      titleEl.style.display = "none";
    } else {
      titleEl.style.display = "";
      titleEl.textContent = brand.APP_DISPLAY_NAME || "iCONTROL";
    }
  });
  
  // Mettre à jour le logo du drawer
  const drawerLogoImg = document.querySelector("#cxDrawerLogoImg") as HTMLImageElement;
  const drawerLogoText = document.querySelector("#cxDrawerLogoText") as HTMLElement;
  if (drawerLogoImg && drawerLogoText) {
    if (logoUrl) {
      drawerLogoImg.src = logoUrl;
      drawerLogoImg.style.display = "block";
      drawerLogoText.style.display = "none";
    } else {
      drawerLogoImg.style.display = "none";
      drawerLogoText.style.display = "block";
      drawerLogoText.textContent = brand.APP_DISPLAY_NAME || "iCONTROL";
    }
  }
}

export function setupLogoThemeObserver(): void {
  try {
    // Observer les changements de thème système
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: light)");
      const handleChange = (e: MediaQueryListEvent) => {
        const theme = e.matches ? "light" : "dark";
        updateAllLogos(theme);
      };
      
      // Support pour addEventListener et addListener (compatibilité)
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handleChange);
      } else if ((mediaQuery as any).addListener) {
        (mediaQuery as any).addListener(handleChange);
      }
    }
    
    // Observer les changements dans localStorage
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key: string, value: string) {
      originalSetItem.call(this, key, value);
      if (key === "icontrol_theme_mode" || key === "icontrol_brand_v1") {
        const theme = detectTheme();
        updateAllLogos(theme);
      }
    };
    
    // Observer les changements de hash (pour les pages qui changent le thème)
    window.addEventListener("storage", (e) => {
      if (e.key === "icontrol_theme_mode" || e.key === "icontrol_brand_v1") {
        const theme = detectTheme();
        updateAllLogos(theme);
      }
    });
  } catch (e) {
    console.warn("Erreur lors de la configuration de l'observer de logo:", e);
  }
}

// Initialiser le logo au chargement
if (typeof window !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      updateAllLogos();
      setupLogoThemeObserver();
    });
  } else {
    updateAllLogos();
    setupLogoThemeObserver();
  }
}
