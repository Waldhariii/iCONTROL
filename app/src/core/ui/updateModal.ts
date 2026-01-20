/**
 * ICONTROL_UPDATE_MODAL_V1
 * Update Modal - Modal de blocage obligatoire pour force update
 */

import type { VersionGateResult } from "../release/versionGate";
import { forceUpdate } from "../release/versionGate";

/**
 * Affiche le modal de mise à jour obligatoire
 */
export function showUpdateModal(result: VersionGateResult): void {
  // Supprimer tout modal existant
  const existing = document.getElementById("icontrol-update-modal");
  if (existing) {
    existing.remove();
  }

  const modal = document.createElement("div");
  modal.style.minWidth = "0";
  modal.style.boxSizing = "border-box";
  modal.id = "icontrol-update-modal";
  modal.setAttribute(
    "style",
    `
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.85);
    z-index: 99999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `
  );

  modal.innerHTML = `
    <div style="
      background: #1e1e1e;
      border: 2px solid #f48771;
      border-radius: 12px;
      padding: 32px;
      max-width: 500px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
    ">
      <div style="
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 20px;
      ">
        <div style="
          width: 48px;
          height: 48px;
          background: rgba(244, 135, 113, 0.15);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        ">⚠️</div>
        <div>
          <h2 style="
            margin: 0;
            font-size: 20px;
            font-weight: 700;
            color: #f48771;
          ">Mise à jour requise</h2>
        </div>
      </div>

      <p style="
        color: #d4d4d4;
        line-height: 1.6;
        margin-bottom: 24px;
      ">
        ${result.message || "Une nouvelle version est disponible. Veuillez mettre à jour pour continuer."}
      </p>

      ${result.latestVersion ? `
        <div style="
          padding: 12px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          margin-bottom: 24px;
        ">
          <div style="
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
          ">
            <span style="color: #858585; font-size: 13px;">Version actuelle minimale requise</span>
            <span style="color: #f48771; font-weight: 600;">${result.minSupportedVersion}</span>
          </div>
          <div style="
            display: flex;
            justify-content: space-between;
          ">
            <span style="color: #858585; font-size: 13px;">Dernière version disponible</span>
            <span style="color: #4ec9b0; font-weight: 600;">${result.latestVersion}</span>
          </div>
        </div>
      ` : ""}

      <button id="icontrol-update-btn" style="
        width: 100%;
        padding: 14px 24px;
        background: #4ec9b0;
        color: #1e1e1e;
        border: none;
        border-radius: 8px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: background 0.2s;
      " onmouseover="this.style.background='#45b8a0'" onmouseout="this.style.background='#4ec9b0'">
        Mettre à jour maintenant
      </button>
    </div>
  `;

  document.body.appendChild(modal);

  // Empêcher la fermeture du modal
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      e.preventDefault();
      e.stopPropagation();
    }
  });

  // Bouton de mise à jour
  const updateBtn = document.getElementById("icontrol-update-btn");
  if (updateBtn) {
    updateBtn.addEventListener("click", () => {
      forceUpdate(result.url);
    });
  }

  // Empêcher toute interaction avec le reste de l'application
  document.body.style.overflow = "hidden";
}

/**
 * Cache le modal de mise à jour
 */
export function hideUpdateModal(): void {
  const modal = document.getElementById("icontrol-update-modal");
  if (modal) {
    modal.remove();
    document.body.style.overflow = "";
  }
}
