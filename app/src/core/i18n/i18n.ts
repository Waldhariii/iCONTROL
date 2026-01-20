/**
 * ICONTROL_I18N_V1
 * Système d'internationalisation (i18n)
 */

export type Language = "fr" | "en";

export interface Translations {
  [key: string]: string | Translations;
}

const translations: Record<Language, Translations> = {
  fr: {
    common: {
      save: "Enregistrer",
      cancel: "Annuler",
      delete: "Supprimer",
      edit: "Modifier",
      search: "Rechercher",
      filter: "Filtrer",
      export: "Exporter",
      import: "Importer",
      close: "Fermer",
      confirm: "Confirmer",
      loading: "Chargement...",
      error: "Erreur",
      success: "Succès",
      warning: "Avertissement",
      info: "Information"
    },
    pages: {
      dashboard: "Tableau de bord",
      users: "Utilisateurs",
      management: "Gestion",
      system: "Système",
      subscription: "Abonnement",
      organization: "Organisation",
      settings: "Paramètres",
      account: "Compte",
      sessions: "Sessions",
      twoFactor: "Authentification à deux facteurs"
    },
    notifications: {
      saved: "Enregistré avec succès",
      deleted: "Supprimé avec succès",
      error: "Une erreur est survenue",
      accessDenied: "Accès refusé"
    }
  },
  en: {
    common: {
      save: "Save",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      search: "Search",
      filter: "Filter",
      export: "Export",
      import: "Import",
      close: "Close",
      confirm: "Confirm",
      loading: "Loading...",
      error: "Error",
      success: "Success",
      warning: "Warning",
      info: "Information"
    },
    pages: {
      dashboard: "Dashboard",
      users: "Users",
      management: "Management",
      system: "System",
      subscription: "Subscription",
      organization: "Organization",
      settings: "Settings",
      account: "Account",
      sessions: "Sessions",
      twoFactor: "Two-Factor Authentication"
    },
    notifications: {
      saved: "Saved successfully",
      deleted: "Deleted successfully",
      error: "An error occurred",
      accessDenied: "Access denied"
    }
  }
};

class I18nManager {
  private currentLanguage: Language = "fr";

  getLanguage(): Language {
    const stored = localStorage.getItem("icontrol_language");
    if (stored === "fr" || stored === "en") {
      this.currentLanguage = stored;
    } else {
      // Détecter langue navigateur
      const browserLang = navigator.language.split("-")[0];
      this.currentLanguage = browserLang === "en" ? "en" : "fr";
    }
    return this.currentLanguage;
  }

  setLanguage(lang: Language) {
    this.currentLanguage = lang;
    localStorage.setItem("icontrol_language", lang);
    // Émettre événement pour mettre à jour l'UI
    window.dispatchEvent(new CustomEvent("language-changed", { detail: lang }));
  }

  t(key: string, params?: Record<string, string>): string {
    const keys = key.split(".");
    let value: any = translations[this.currentLanguage];

    for (const k of keys) {
      value = value?.[k];
      if (value === undefined) {
        // Fallback vers français si traduction manquante
        value = translations.fr;
        for (const k2 of keys) {
          value = value?.[k2];
        }
        break;
      }
    }

    if (typeof value !== "string") {
      return key; // Retourner la clé si traduction non trouvée
    }

    // Remplacer paramètres
    if (params) {
      return value.replace(/\{\{(\w+)\}\}/g, (match, param) => {
        return params[param] || match;
      });
    }

    return value;
  }

  getCurrentLanguage(): Language {
    return this.currentLanguage;
  }

  getAvailableLanguages(): Language[] {
    return ["fr", "en"];
  }
}

export const i18n = new I18nManager();
i18n.getLanguage(); // Initialiser
