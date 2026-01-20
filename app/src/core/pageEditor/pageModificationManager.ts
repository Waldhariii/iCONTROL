import { getCurrentHash } from "/src/runtime/navigate";
/**
 * ICONTROL_PAGE_MODIFICATION_MANAGER_V1
 * Gestionnaire de modifications visuelles des pages
 * 
 * Ce module gère :
 * - Les modifications en mode draft (brouillon)
 * - La publication en environnement test
 * - La validation avant publication officielle
 * - La notification de mise à jour lors de la publication
 */

export type ModificationStatus = "draft" | "test" | "production" | "archived";

export interface PageModification {
  id: string;
  pageId: string;
  pageName: string;
  modifications: Record<string, any>;
  status: ModificationStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  publishedBy?: string;
  version: string;
  description?: string;
  validationErrors?: string[];
  testResults?: {
    errors: number;
    warnings: number;
    passed: boolean;
  };
}

export interface ModificationValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Stockage des modifications en localStorage (en attendant un backend)
 */
const STORAGE_KEY_DRAFTS = "icontrol_page_modifications_drafts";
const STORAGE_KEY_TEST = "icontrol_page_modifications_test";
const STORAGE_KEY_PRODUCTION = "icontrol_page_modifications_production";

/**
 * Récupère toutes les modifications en draft
 */
export function getDraftModifications(): PageModification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_DRAFTS);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Récupère toutes les modifications en test
 */
export function getTestModifications(): PageModification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_TEST);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Récupère toutes les modifications en production
 */
export function getProductionModifications(): PageModification[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY_PRODUCTION);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

/**
 * Sauvegarde une modification en draft
 */
export function saveDraftModification(modification: PageModification): void {
  const drafts = getDraftModifications();
  const existingIndex = drafts.findIndex(m => m.id === modification.id);
  
  if (existingIndex >= 0) {
    drafts[existingIndex] = { ...modification, updatedAt: new Date().toISOString() };
  } else {
    drafts.push(modification);
  }
  
  localStorage.setItem(STORAGE_KEY_DRAFTS, JSON.stringify(drafts));
}

/**
 * Publie une modification en environnement test
 */
export function publishToTest(modificationId: string, userId: string): boolean {
  const drafts = getDraftModifications();
  const modification = drafts.find(m => m.id === modificationId);
  
  if (!modification) {
    return false;
  }
  
  // Valider avant publication en test
  const validation = validateModification(modification);
  if (!validation.valid) {
    return false;
  }
  
  // Retirer du draft
  const updatedDrafts = drafts.filter(m => m.id !== modificationId);
  localStorage.setItem(STORAGE_KEY_DRAFTS, JSON.stringify(updatedDrafts));
  
  // Ajouter en test
  const testMods = getTestModifications();
  const updatedModification: PageModification = {
    ...modification,
    status: "test",
    publishedAt: new Date().toISOString(),
    publishedBy: userId,
    version: `${modification.version}-test`,
  };
  
  testMods.push(updatedModification);
  localStorage.setItem(STORAGE_KEY_TEST, JSON.stringify(testMods));
  
  return true;
}

/**
 * Publie une modification en production (après validation)
 */
export function publishToProduction(modificationId: string, userId: string): boolean {
  const testMods = getTestModifications();
  const modification = testMods.find(m => m.id === modificationId);
  
  if (!modification) {
    return false;
  }
  
  // Vérifier que les tests passent
  if (modification.testResults && !modification.testResults.passed) {
    return false;
  }
  
  // Retirer du test
  const updatedTest = testMods.filter(m => m.id !== modificationId);
  localStorage.setItem(STORAGE_KEY_TEST, JSON.stringify(updatedTest));
  
  // Ajouter en production
  const productionMods = getProductionModifications();
  const updatedModification: PageModification = {
    ...modification,
    status: "production",
    publishedAt: new Date().toISOString(),
    publishedBy: userId,
    version: modification.version.replace("-test", ""),
  };
  
  productionMods.push(updatedModification);
  localStorage.setItem(STORAGE_KEY_PRODUCTION, JSON.stringify(productionMods));
  
  // Marquer qu'une nouvelle version est disponible
  localStorage.setItem("icontrol_new_version_available", "true");
  localStorage.setItem("icontrol_new_version_id", modificationId);
  localStorage.setItem("icontrol_new_version_message", `Nouvelle version publiée pour ${modification.pageName}`);
  
  return true;
}

/**
 * Valide une modification
 */
export function validateModification(modification: PageModification): ModificationValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Vérifications de base
  if (!modification.pageId) {
    errors.push("L'ID de la page est requis");
  }
  
  if (!modification.modifications || Object.keys(modification.modifications).length === 0) {
    warnings.push("Aucune modification détectée");
  }
  
  // Vérifier la structure des modifications
  // (ici, vous pouvez ajouter plus de validations selon vos besoins)
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Exécute des tests sur une modification en test
 */
export async function runTests(modificationId: string): Promise<ModificationValidationResult> {
  const testMods = getTestModifications();
  const modification = testMods.find(m => m.id === modificationId);
  
  if (!modification) {
    return {
      valid: false,
      errors: ["Modification introuvable"],
      warnings: [],
    };
  }
  
  // Simuler des tests (dans un vrai système, cela ferait des appels API)
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Test 1: Vérifier qu'il n'y a pas d'erreurs JavaScript
  // Test 2: Vérifier que les styles CSS sont valides
  // Test 3: Vérifier que les composants sont accessibles
  // etc.
  
  const passed = errors.length === 0;
  
  // Mettre à jour les résultats de test
  const updatedMods = testMods.map(m => {
    if (m.id === modificationId) {
      return {
        ...m,
        testResults: {
          errors: errors.length,
          warnings: warnings.length,
          passed,
        },
      };
    }
    return m;
  });
  
  localStorage.setItem(STORAGE_KEY_TEST, JSON.stringify(updatedMods));
  
  return {
    valid: passed,
    errors,
    warnings,
  };
}

/**
 * Supprime une modification (draft ou test uniquement)
 */
export function deleteModification(modificationId: string, status: "draft" | "test"): boolean {
  if (status === "draft") {
    const drafts = getDraftModifications();
    const updated = drafts.filter(m => m.id !== modificationId);
    localStorage.setItem(STORAGE_KEY_DRAFTS, JSON.stringify(updated));
    return true;
  }
  
  if (status === "test") {
    const testMods = getTestModifications();
    const updated = testMods.filter(m => m.id !== modificationId);
    localStorage.setItem(STORAGE_KEY_TEST, JSON.stringify(updated));
    return true;
  }
  
  return false;
}

/**
 * Applique les modifications publiées à la page actuelle après refresh
 */
export function applyPublishedModifications(): void {
  try {
    const pageId = getCurrentHash() || window.location.pathname;
    const productionMods = getProductionModifications();
    
    // Trouver les modifications pour cette page
    const pageMods = productionMods.filter(m => 
      m.pageId === pageId || m.pageId.includes(pageId) || pageId.includes(m.pageId)
    );
    
    if (pageMods.length === 0) {
      // Vérifier aussi dans localStorage (fallback)
      const applyFlag = localStorage.getItem("icontrol_apply_modifications");
      const savedPageId = localStorage.getItem("icontrol_modifications_page_id");
      const savedMods = localStorage.getItem("icontrol_modifications_data");
      
      if (applyFlag === "true" && savedPageId === pageId && savedMods) {
        try {
          const modifications = JSON.parse(savedMods);
          applyModificationsToDOM(modifications);
          localStorage.removeItem("icontrol_apply_modifications");
          localStorage.removeItem("icontrol_modifications_page_id");
          localStorage.removeItem("icontrol_modifications_data");
        } catch (e) {
          console.error("Erreur lors de l'application des modifications:", e);
        }
      }
      return;
    }
    
    // Appliquer les modifications de la version la plus récente
    const latestMod = pageMods.sort((a, b) => 
      new Date(b.publishedAt || b.updatedAt).getTime() - 
      new Date(a.publishedAt || a.updatedAt).getTime()
    )[0];
    
    if (latestMod && latestMod.modifications) {
      applyModificationsToDOM(latestMod.modifications);
      
      // Afficher une notification
      showUpdateNotification(latestMod.pageName, latestMod.version);
    }
  } catch (e) {
    console.error("Erreur lors de l'application des modifications publiées:", e);
  }
}

/**
 * Applique les modifications au DOM
 */
function applyModificationsToDOM(modifications: Record<string, any>): void {
  Object.entries(modifications).forEach(([key, mod]) => {
    try {
      let element: HTMLElement | null = null;
      
      // Essayer de trouver l'élément par ID d'abord
      if (mod.id) {
        element = document.getElementById(mod.id);
      }
      
      // Sinon essayer par sélecteur
      if (!element && mod.selector) {
        element = document.querySelector(mod.selector) as HTMLElement;
      }
      
      // Sinon essayer par classe
      if (!element && mod.className) {
        const firstClass = mod.className.split(' ')[0];
        element = document.querySelector(`.${firstClass}`) as HTMLElement;
      }
      
      if (element) {
        // Appliquer les modifications
        if (mod.style) {
          element.style.cssText = mod.style;
        }
        if (mod.innerHTML) {
          element.innerHTML = mod.innerHTML;
        }
        if (mod.id && mod.id !== element.id) {
          element.id = mod.id;
        }
        if (mod.className) {
          element.className = mod.className;
        }
      }
    } catch (e) {
      console.warn(`Impossible d'appliquer la modification pour ${key}:`, e);
    }
  });
}

/**
 * Affiche une notification de mise à jour
 */
function showUpdateNotification(pageName: string, version: string): void {
  const notification = document.createElement("div");
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: rgba(78, 201, 176, 0.15);
    border: 1px solid #4ec9b0;
    border-left: 4px solid #4ec9b0;
    border-radius: 8px;
    padding: 16px 20px;
    color: #4ec9b0;
    font-weight: 600;
    z-index: 10005;
    max-width: 400px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.5);
  `;
  notification.innerHTML = `
    <div style="font-size:14px;margin-bottom:8px;">✅ Mise à jour appliquée</div>
    <div style="font-size:12px;opacity:0.9;">Les modifications de "${pageName}" (v${version}) ont été appliquées.</div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.transition = "opacity 0.3s";
    notification.style.opacity = "0";
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}
