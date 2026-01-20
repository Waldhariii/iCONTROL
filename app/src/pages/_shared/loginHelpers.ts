/**
 * ICONTROL_LOGIN_HELPERS_V1
 * Fonctions partagées pour les pages de connexion APP et CP
 * Évite la duplication de code entre app/login.ts et cp/login.ts
 */
import { navigate } from "/src/router";
import { debugLog } from "/src/core/utils/logger";

export type AuthenticateFunction = (
  username: string,
  password: string
) => Promise<{ ok: true; session: any } | { ok: false; error: string }> | ({ ok: true; session: any } | { ok: false; error: string });

export interface LoginElements {
  u: HTMLInputElement;
  p: HTMLInputElement;
  err: HTMLDivElement;
  btn: HTMLButtonElement;
}

/**
 * Crée la fonction submit partagée pour éviter la duplication
 * ICONTROL_ASYNC_AUTH_V1: Support des fonctions d'authentification async
 */
export function createLoginSubmit(
  elements: LoginElements,
  authenticateFn: AuthenticateFunction,
  appType: "APP" | "CP"
): () => void {
  return async () => {
    elements.err.textContent = "";
    elements.btn.disabled = true;
    elements.btn.textContent = "Connexion...";
    
    const username = (elements.u.value || "").trim();
    const password = (elements.p.value || "").trim();
    
    // ICONTROL_DEBUG_LOGS_V1: Logs uniquement en mode développement
    debugLog(
      appType === "CP" ? "🟣 Tentative de connexion CP" : "🔵 Tentative de connexion",
      { username, passwordLength: password.length }
    );
    
    try {
      const res = await authenticateFn(username, password);
      
      debugLog(
        appType === "CP" ? "🟣 Résultat authentification CP" : "🔵 Résultat authentification",
        { ok: res.ok, error: res.ok ? undefined : res.error }
      );
      
      if (!res.ok) {
        elements.err.textContent = res.error;
        elements.btn.disabled = false;
        elements.btn.textContent = "Se connecter";
        return;
      }
      
      navigate("#/dashboard");
    } catch (error) {
      console.error("Erreur lors de l'authentification:", error);
      elements.err.textContent = "Une erreur est survenue lors de la connexion.";
      elements.btn.disabled = false;
      elements.btn.textContent = "Se connecter";
    }
  };
}

/**
 * Attache les event listeners pour le formulaire de login
 */
export function attachLoginListeners(
  elements: LoginElements,
  submitFn: () => void
): void {
  elements.btn.onclick = submitFn;
  elements.p.addEventListener("keydown", (e) => {
    if (e.key === "Enter") submitFn();
  });
}
