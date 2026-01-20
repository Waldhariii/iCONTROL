/**
 * ICONTROL_CP_2FA_V1
 * Page de configuration 2FA (Two-Factor Authentication)
 */

import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { requireSession } from "/src/localAuth";
import { getRole } from "/src/runtime/rbac";
import { createToolboxPanelElement } from "/src/core/ui/toolboxPanel";
import { twoFactorAuth } from "/src/core/security/twoFactorAuth";
import { showConfirmDialog } from "/src/core/ui/confirmDialog";
import { notificationManager } from "/src/core/ui/notificationCenter";
import { createAlert } from "/src/core/ui/alert";
import { safeRender, fetchJsonSafe, mapSafeMode, getSafeMode } from "/src/core/runtime/safe";

export function renderTwoFactorPage(root: HTMLElement): void {
  root.innerHTML = coreBaseStyles();

  const wrap = document.createElement("div");
  wrap.style.minWidth = "0";
  wrap.style.boxSizing = "border-box";
  wrap.className = "cxWrap";
  wrap.setAttribute("style", "display:flex; flex-direction:column; align-items:stretch; justify-content:flex-start; padding:0; gap:20px; width:100%; max-width:100%; overflow-x:hidden; box-sizing:border-box; background:transparent; min-height:auto;");
  
  const { panel: card, content: cardContent } = createToolboxPanelElement(
    "Authentification à deux facteurs (2FA)",
    "Sécurisez votre compte avec l'authentification à deux facteurs"
  );
  
  const headerTitleDiv = card.querySelector(".icontrol-panel-header > div");
  if (headerTitleDiv) {
    const iconSpan = document.createElement("span");
    iconSpan.textContent = "🔒";
    iconSpan.style.cssText = "font-size:18px;margin-right:8px;";
    headerTitleDiv.parentElement?.insertBefore(iconSpan, headerTitleDiv);
  }
  
  wrap.appendChild(card);
  root.appendChild(wrap);

  const s = requireSession();
  const isEnabled = twoFactorAuth.is2FAEnabled(s.username);
  const config = twoFactorAuth.get2FAConfig(s.username);

  // État actuel
  const statusDiv = document.createElement("div");
  statusDiv.style.cssText = "padding: 16px; border: 1px solid var(--ic-border, #2b3136); border-radius: 8px; margin-bottom: 20px;";

  if (isEnabled) {
    statusDiv.appendChild(createAlert({
      type: "success",
      title: "2FA activé",
      message: "Votre compte est protégé par l'authentification à deux facteurs.",
      dismissible: false
    }));

    const infoDiv = document.createElement("div");
    infoDiv.style.cssText = "margin-top: 16px; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 6px;";
    infoDiv.innerHTML = `
      <div style="display:flex;justify-content:space-between;margin-bottom:8px;">
        <span style="color:var(--ic-mutedText, #a7b0b7);">Activé le</span>
        <span style="color:var(--ic-text, #e7ecef);">${config?.createdAt ? new Date(config.createdAt).toLocaleDateString('fr-FR') : "N/A"}</span>
      </div>
      ${config?.lastVerified ? `
      <div style="display:flex;justify-content:space-between;">
        <span style="color:var(--ic-mutedText, #a7b0b7);">Dernière vérification</span>
        <span style="color:var(--ic-text, #e7ecef);">${new Date(config.lastVerified).toLocaleDateString('fr-FR')}</span>
      </div>
      ` : ""}
    `;
    statusDiv.appendChild(infoDiv);

    const disableBtn = document.createElement("button");
    disableBtn.textContent = "Désactiver 2FA";
    disableBtn.style.cssText = `
      margin-top: 16px;
      padding: 10px 20px;
      background: rgba(244,135,113,0.15);
      border: 1px solid #f48771;
      color: #f48771;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      font-size: 13px;
      transition: all 0.2s;
    `;
    disableBtn.onmouseenter = () => { disableBtn.style.background = "rgba(244,135,113,0.25)"; };
    disableBtn.onmouseleave = () => { disableBtn.style.background = "rgba(244,135,113,0.15)"; };
    disableBtn.onclick = () => {
      showConfirmDialog({
        title: "Désactiver 2FA",
        message: "Êtes-vous sûr de vouloir désactiver l'authentification à deux facteurs ? Votre compte sera moins sécurisé.",
        confirmText: "Désactiver",
        confirmColor: "danger",
        onConfirm: () => {
          twoFactorAuth.disable2FA(s.username);
          notificationManager.add({
            type: "warning",
            title: "2FA désactivé",
            message: "L'authentification à deux facteurs a été désactivée pour votre compte."
          });
          location.reload();
        }
      });
    };
    statusDiv.appendChild(disableBtn);
  } else {
    statusDiv.appendChild(createAlert({
      type: "warning",
      title: "2FA non activé",
      message: "Activez l'authentification à deux facteurs pour renforcer la sécurité de votre compte.",
      dismissible: false
    }));

    const setupBtn = document.createElement("button");
    setupBtn.textContent = "🔒 Activer 2FA";
    setupBtn.style.cssText = `
      margin-top: 16px;
      padding: 12px 24px;
      background: var(--ic-panel, #37373d);
      border: 1px solid var(--ic-border, #2b3136);
      color: var(--ic-text, #e7ecef);
      border-radius: 6px;
      cursor: pointer;
      font-weight: 700;
      font-size: 14px;
      transition: all 0.2s;
    `;
    setupBtn.onmouseenter = () => { setupBtn.style.background = "rgba(255,255,255,0.05)"; };
    setupBtn.onmouseleave = () => { setupBtn.style.background = "var(--ic-panel, #37373d)"; };
    setupBtn.onclick = () => {
      setup2FA(s.username);
    };
    statusDiv.appendChild(setupBtn);
  }

  cardContent.appendChild(statusDiv);

  // Instructions
  const instructionsDiv = document.createElement("div");
  instructionsDiv.style.cssText = "padding: 20px; background: rgba(255,255,255,0.02); border-radius: 8px;";
  instructionsDiv.innerHTML = `
    <h3 style="color:var(--ic-text, #e7ecef);font-size:16px;font-weight:600;margin-bottom:12px;">📱 Comment utiliser 2FA</h3>
    <ol style="color:var(--ic-mutedText, #a7b0b7);font-size:13px;line-height:1.8;margin-left:20px;">
      <li>Téléchargez une application d'authentification (Google Authenticator, Authy, Microsoft Authenticator)</li>
      <li>Scannez le code QR affiché lors de l'activation</li>
      <li>Entrez le code à 6 chiffres généré par l'application pour vérifier</li>
      <li>Une fois activé, vous devrez entrer ce code à chaque connexion</li>
    </ol>
  `;
  cardContent.appendChild(instructionsDiv);
}

function setup2FA(username: string) {
  const { secret, qrCodeUrl } = twoFactorAuth.generateSecret(username);

  const modal = document.createElement("div");
  modal.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.7);
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
  `;

  modal.innerHTML = `
    <div style="background:#1e1e1e;border:1px solid #3e3e3e;border-radius:12px;padding:24px;max-width:500px;width:100%;">
      <h3 style="font-size:18px;font-weight:700;color:#d4d4d4;margin-bottom:16px;">Activer 2FA</h3>
      <div style="margin-bottom:20px;">
        <p style="color:#858585;font-size:13px;margin-bottom:12px;">1. Scannez ce code QR avec votre application d'authentification:</p>
        <div id="qrCodeContainer" style="text-align:center;padding:20px;background:white;border-radius:8px;margin-bottom:12px;">
          <div style="color:#333;font-size:12px;">QR Code: ${qrCodeUrl}</div>
          <p style="color:#666;font-size:11px;margin-top:8px;">Note: Pour une vraie implémentation, générer une vraie image QR code ici</p>
        </div>
        <p style="color:#858585;font-size:13px;margin-bottom:12px;">2. Ou entrez ce code manuellement:</p>
        <div style="padding:12px;background:#252526;border-radius:6px;font-family:monospace;font-size:14px;color:#9cdcfe;text-align:center;letter-spacing:2px;">
          ${secret}
        </div>
      </div>
      <div style="margin-bottom:20px;">
        <label style="display:block;color:#858585;font-size:13px;margin-bottom:6px;font-weight:600;">Code de vérification (6 chiffres)</label>
        <input id="verificationCode" type="text" maxlength="6" placeholder="000000" 
          style="width:100%;padding:10px 12px;border-radius:6px;border:1px solid #3e3e3e;background:#252526;color:#d4d4d4;font-size:16px;letter-spacing:4px;text-align:center;font-family:monospace;" />
      </div>
      <div style="display:flex;gap:12px;justify-content:flex-end;">
        <button id="cancelBtn" style="padding:10px 20px;background:transparent;color:#858585;border:1px solid #3e3e3e;border-radius:8px;cursor:pointer;font-weight:600;">Annuler</button>
        <button id="verifyBtn" style="padding:10px 20px;background:#37373d;color:white;border:1px solid #3e3e3e;border-radius:8px;cursor:pointer;font-weight:700;">Vérifier et activer</button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  const verificationCodeInput = modal.querySelector("#verificationCode") as HTMLInputElement;
  const verifyBtn = modal.querySelector("#verifyBtn") as HTMLButtonElement;
  const cancelBtn = modal.querySelector("#cancelBtn") as HTMLButtonElement;

  verificationCodeInput.focus();

  verificationCodeInput.oninput = () => {
    verificationCodeInput.value = verificationCodeInput.value.replace(/[^0-9]/g, "");
  };

  verifyBtn.onclick = async () => {
    const code = verificationCodeInput.value.trim();
    if (code.length !== 6) {
      alert("Veuillez entrer un code à 6 chiffres");
      return;
    }

    verifyBtn.disabled = true;
    verifyBtn.textContent = "Vérification...";

    const success = await twoFactorAuth.enable2FA(username, code);
    if (success) {
      notificationManager.add({
        type: "success",
        title: "2FA activé",
        message: "L'authentification à deux facteurs a été activée avec succès !"
      });
      document.body.removeChild(modal);
      location.reload();
    } else {
      alert("Code incorrect. Veuillez réessayer.");
      verifyBtn.disabled = false;
      verifyBtn.textContent = "Vérifier et activer";
      verificationCodeInput.value = "";
      verificationCodeInput.focus();
    }
  };

  cancelBtn.onclick = () => {
    document.body.removeChild(modal);
  };

  modal.onclick = (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  };
}
