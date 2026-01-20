/**
 * ICONTROL_CP_SETTINGS_V3
 * Page Paramètres pour l'application ADMINISTRATION (/cp)
 * Dédiée à la configuration de l'application (nom, logo, thème, etc.)
 */
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { getBrandResolved, setBrandLocalOverride, getBrand } from "../../../../platform-services/branding/brandService";
import type { Brand } from "../../../../core-kernel/contracts/BrandingPort";
import { detectTheme, updateAllLogos } from "../../core/branding/logoManager";
import { createToolboxPanelElement } from "/src/core/ui/toolboxPanel";

const SETTING_SECTION_STYLE = `
  margin-top: 20px;
  padding: 0;
  border: 1px solid var(--ic-border, var(--line));
  border-radius: 0;
  background: var(--ic-card, var(--panel));
  display: flex;
  flex-direction: column;
`;

export function renderSettingsPage(root: HTMLElement): void {
  root.innerHTML = coreBaseStyles();

  const wrap = document.createElement("div");
  wrap.style.minWidth = "0";
  wrap.style.boxSizing = "border-box";
  wrap.className = "cxWrap";
  wrap.setAttribute("style", "display:flex; flex-direction:column; align-items:stretch; justify-content:flex-start; padding:0; gap:20px; width:100%; max-width:100%; overflow-x:hidden; box-sizing:border-box; background:transparent; min-height:auto;");
  
  const { panel: card, content: cardContent } = createToolboxPanelElement(
    "Paramètres - Administration",
    "Configuration de l'application : nom, logo, thème et autres paramètres"
  );
  
  // Ajouter l'icône dans le header
  const headerTitleDiv = card.querySelector(".icontrol-panel-header > div");
  if (headerTitleDiv) {
    const iconSpan = document.createElement("span");
    iconSpan.textContent = "⚙️";
    iconSpan.style.cssText = "font-size:18px;margin-right:8px;";
    headerTitleDiv.parentElement?.insertBefore(iconSpan, headerTitleDiv);
  }
  
  wrap.appendChild(card);
  root.appendChild(wrap);

  const brandResolved = getBrandResolved();
  const brand = brandResolved.brand;
  const currentTheme = detectTheme();

  // Section: Informations de l'application - Style Toolbox Panel
  const { panel: appInfoSection, content: appInfoContent } = createToolboxPanelElement(
    "Informations de l'application"
  );
  appInfoContent.innerHTML = `
    <div style="display: grid; gap: 12px; margin-top: 0;">
      <div style="display: flex; justify-content: space-between; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px;">
        <span style="color: #858585;">Version</span>
        <span style="font-weight: 600;">iCONTROL v0.2.0</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px;">
        <span style="color: #858585;">Mode</span>
        <span style="font-weight: 600;">Administration</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px;">
        <span style="color: #858585;">Environnement</span>
        <span style="font-weight: 600;">Production</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px;">
        <span style="color: #858585;">Source de configuration</span>
        <span style="font-weight: 600; color: #9cdcfe;">${brandResolved.source}</span>
      </div>
    </div>
  `;
  cardContent.appendChild(appInfoSection);

  // Section: Nom de l'application - Style Toolbox Panel
  const { panel: appNameSection, content: appNameContent } = createToolboxPanelElement(
    "Nom de l'application"
  );
  appNameSection.style.marginTop = "20px";
  
  // Ajouter l'icône dans le header
  const appNameHeaderTitleDiv = appNameSection.querySelector(".icontrol-panel-header > div");
  if (appNameHeaderTitleDiv) {
    const iconSpan = document.createElement("span");
    iconSpan.textContent = "📝";
    iconSpan.style.cssText = "font-size:16px;margin-right:8px;";
    appNameHeaderTitleDiv.parentElement?.insertBefore(iconSpan, appNameHeaderTitleDiv);
  }
  
  appNameContent.innerHTML = `
    <div style="display: grid; gap: 12px;">
      <div>
        <label style="display: block; color: #858585; font-size: 13px; margin-bottom: 6px;">Nom d'affichage</label>
        <input id="app-display-name" type="text" value="${brand.APP_DISPLAY_NAME || ""}" 
          style="width:100%; padding:10px 12px; border-radius:8px; border:1px solid #3e3e3e; background:#252526; color:#d4d4d4; font-size:14px; outline:none;"
          placeholder="Nom de l'application" />
      </div>
      <div>
        <label style="display: block; color: #858585; font-size: 13px; margin-bottom: 6px;">Nom court</label>
        <input id="app-short-name" type="text" value="${brand.APP_SHORT_NAME || ""}" 
          style="width:100%; padding:10px 12px; border-radius:8px; border:1px solid #3e3e3e; background:#252526; color:#d4d4d4; font-size:14px; outline:none;"
          placeholder="Nom court" />
      </div>
      <div>
        <label style="display: block; color: #858585; font-size: 13px; margin-bottom: 6px;">Nom légal</label>
        <input id="app-legal-name" type="text" value="${brand.LEGAL_NAME || ""}" 
          style="width:100%; padding:10px 12px; border-radius:8px; border:1px solid #3e3e3e; background:#252526; color:#d4d4d4; font-size:14px; outline:none;"
          placeholder="Nom légal de l'entreprise" />
      </div>
      <div>
        <label style="display: block; color: #858585; font-size: 13px; margin-bottom: 6px;">Suffixe du titre</label>
        <input id="app-title-suffix" type="text" value="${brand.TITLE_SUFFIX || ""}" 
          style="width:100%; padding:10px 12px; border-radius:8px; border:1px solid #3e3e3e; background:#252526; color:#d4d4d4; font-size:14px; outline:none;"
          placeholder="Ex: — Gestion PME" />
      </div>
      <button id="save-app-name" class="cxBtn" style="margin-top:8px; padding:10px 16px; background:#37373d; color:white; border:1px solid #3e3e3e; border-radius:8px; cursor:pointer; font-weight:600;">
        Enregistrer les modifications
      </button>
    </div>
  `;
  cardContent.appendChild(appNameSection);

  // Section: Logos
  const logoSection = document.createElement("div");
  logoSection.setAttribute("style", SETTING_SECTION_STYLE);
  const logoLight = (brand as any).LOGO_LIGHT || "";
  const logoDark = (brand as any).LOGO_DARK || "";
  logoSection.innerHTML = `
    <div style="font-size: 16px; font-weight: 700; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
      <span>🖼️</span> Logos de l'application
    </div>
    <div style="color: #858585; font-size: 13px; margin-bottom: 16px; line-height: 1.6;">
      Configurez les logos pour les thèmes clair et sombre. Le logo changera automatiquement selon le thème actif.
    </div>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
      <div>
        <label style="display: block; color: #858585; font-size: 13px; margin-bottom: 8px;">Logo thème sombre</label>
        <div style="margin-bottom: 12px; padding: 16px; border: 1px solid #3e3e3e; border-radius: 8px; background: #252526; display: flex; align-items: center; justify-content: center; min-height: 80px;">
          <img id="logo-dark-preview" src="${logoDark || ""}" alt="Logo dark" 
            style="max-width: 200px; max-height: 60px; object-fit: contain; opacity: ${logoDark ? "1" : "0.3"}; transition: opacity 0.3s ease-in-out;"
            onerror="this.style.display='none'" />
          ${!logoDark ? `<span style="color: #858585; font-size: 12px;">Aucun logo</span>` : ""}
        </div>
        <input id="logo-dark-url" type="text" value="${logoDark}" 
          style="width:100%; padding:10px 12px; border-radius:8px; border:1px solid #3e3e3e; background:#252526; color:#d4d4d4; font-size:13px; outline:none; margin-bottom:8px;"
          placeholder="URL ou chemin du logo (thème sombre)" />
        <input id="logo-dark-file" type="file" accept="image/*" 
          style="width:100%; padding:8px; border-radius:8px; border:1px solid #3e3e3e; background:#252526; color:#d4d4d4; font-size:12px; cursor:pointer;" />
      </div>
      <div>
        <label style="display: block; color: #858585; font-size: 13px; margin-bottom: 8px;">Logo thème clair</label>
        <div style="margin-bottom: 12px; padding: 16px; border: 1px solid #3e3e3e; border-radius: 8px; background: #f5f5f5; display: flex; align-items: center; justify-content: center; min-height: 80px;">
          <img id="logo-light-preview" src="${logoLight || ""}" alt="Logo light" 
            style="max-width: 200px; max-height: 60px; object-fit: contain; opacity: ${logoLight ? "1" : "0.3"}; transition: opacity 0.3s ease-in-out;"
            onerror="this.style.display='none'" />
          ${!logoLight ? `<span style="color: #858585; font-size: 12px;">Aucun logo</span>` : ""}
        </div>
        <input id="logo-light-url" type="text" value="${logoLight}" 
          style="width:100%; padding:10px 12px; border-radius:8px; border:1px solid #3e3e3e; background:#252526; color:#d4d4d4; font-size:13px; outline:none; margin-bottom:8px;"
          placeholder="URL ou chemin du logo (thème clair)" />
        <input id="logo-light-file" type="file" accept="image/*" 
          style="width:100%; padding:8px; border-radius:8px; border:1px solid #3e3e3e; background:#252526; color:#d4d4d4; font-size:12px; cursor:pointer;" />
      </div>
    </div>
    <div style="padding: 12px; background: rgba(78, 201, 176, 0.1); border: 1px solid rgba(78, 201, 176, 0.3); border-radius: 8px; color: #4ec9b0; font-size: 13px;">
      💡 Le logo change automatiquement selon le thème actif. Le logo sombre est utilisé pour les thèmes sombres, le logo clair pour les thèmes clairs.
    </div>
    <button id="save-logos" class="cxBtn" style="margin-top:16px; padding:10px 16px; background:#37373d; color:white; border:1px solid #3e3e3e; border-radius:8px; cursor:pointer; font-weight:600;">
      Enregistrer les logos
    </button>
  `;
  cardContent.appendChild(logoSection);

  // Section: Thème et couleurs - Style Toolbox Panel
  const { panel: themeSection, content: themeContent } = createToolboxPanelElement(
    "Thème et couleurs"
  );
  themeSection.style.marginTop = "20px";
  
  // Ajouter l'icône dans le header
  const themeHeaderTitleDiv = themeSection.querySelector(".icontrol-panel-header > div");
  if (themeHeaderTitleDiv) {
    const iconSpan = document.createElement("span");
    iconSpan.textContent = "🎨";
    iconSpan.style.cssText = "font-size:16px;margin-right:8px;";
    themeHeaderTitleDiv.parentElement?.insertBefore(iconSpan, themeHeaderTitleDiv);
  }
  
  themeContent.innerHTML = `
    <div style="display: grid; gap: 12px;">
      <div>
        <label style="display: block; color: #858585; font-size: 13px; margin-bottom: 6px;">Mode de thème</label>
        <select id="theme-mode" 
          style="width:100%; padding:10px 12px; border-radius:8px; border:1px solid #3e3e3e; background:#252526; color:#d4d4d4; font-size:14px; outline:none; cursor:pointer;">
          <option value="dark" ${brand.THEME_MODE === "dark" ? "selected" : ""}>Sombre</option>
          <option value="light" ${brand.THEME_MODE === "light" ? "selected" : ""}>Clair</option>
          <option value="auto" ${brand.THEME_MODE === "auto" ? "selected" : ""}>Automatique</option>
        </select>
      </div>
      <div>
        <label style="display: block; color: #858585; font-size: 13px; margin-bottom: 6px;">Couleur d'accent</label>
        <div style="display: flex; gap: 8px; align-items: center;">
          <input id="accent-color" type="color" value="${brand.ACCENT_COLOR || "#6D28D9"}" 
            style="width:60px; height:40px; border-radius:8px; border:1px solid #3e3e3e; cursor:pointer;" />
          <input id="accent-color-text" type="text" value="${brand.ACCENT_COLOR || "#6D28D9"}" 
            style="flex:1; padding:10px 12px; border-radius:8px; border:1px solid #3e3e3e; background:#252526; color:#d4d4d4; font-size:14px; outline:none; font-family:monospace;"
            placeholder="#6D28D9" />
        </div>
      </div>
      <button id="save-theme" class="cxBtn" style="margin-top:8px; padding:10px 16px; background:#37373d; color:white; border:1px solid #3e3e3e; border-radius:8px; cursor:pointer; font-weight:600;">
        Enregistrer le thème
      </button>
    </div>
  `;
  cardContent.appendChild(themeSection);

  // Section: Paramètres avancés - Style Toolbox Panel
  const { panel: advancedSection, content: advancedContent } = createToolboxPanelElement(
    "Paramètres avancés"
  );
  advancedSection.style.marginTop = "20px";
  
  // Ajouter l'icône dans le header
  const advancedHeaderTitleDiv = advancedSection.querySelector(".icontrol-panel-header > div");
  if (advancedHeaderTitleDiv) {
    const iconSpan = document.createElement("span");
    iconSpan.textContent = "⚙️";
    iconSpan.style.cssText = "font-size:16px;margin-right:8px;";
    advancedHeaderTitleDiv.parentElement?.insertBefore(iconSpan, advancedHeaderTitleDiv);
  }
  
  advancedContent.innerHTML = `
    <div style="display: grid; gap: 12px;">
      <div>
        <label style="display: block; color: #858585; font-size: 13px; margin-bottom: 6px;">Identifiant locataire (Tenant ID)</label>
        <input id="tenant-id" type="text" value="${brand.TENANT_ID || ""}" 
          style="width:100%; padding:10px 12px; border-radius:8px; border:1px solid #3e3e3e; background:#252526; color:#d4d4d4; font-size:14px; outline:none; font-family:monospace;"
          placeholder="icontrol-default" />
      </div>
      <div style="padding: 12px; background: rgba(255,255,255,0.02); border-radius: 8px; color: #858585; font-size: 12px; line-height: 1.6;">
        <strong>Note:</strong> Modifier le Tenant ID peut affecter l'isolation des données. Utilisez avec précaution.
      </div>
      <button id="save-advanced" class="cxBtn" style="margin-top:8px; padding:10px 16px; background:#37373d; color:white; border:1px solid #3e3e3e; border-radius:8px; cursor:pointer; font-weight:600;">
        Enregistrer les paramètres avancés
      </button>
    </div>
  `;
  cardContent.appendChild(advancedSection);

  // Section: Actions rapides - Style Toolbox Panel
  const { panel: actionsSection, content: actionsContent } = createToolboxPanelElement(
    "Actions rapides"
  );
  actionsSection.style.marginTop = "20px";
  
  // Ajouter l'icône dans le header
  const actionsHeaderTitleDiv = actionsSection.querySelector(".icontrol-panel-header > div");
  if (actionsHeaderTitleDiv) {
    const iconSpan = document.createElement("span");
    iconSpan.textContent = "🔧";
    iconSpan.style.cssText = "font-size:16px;margin-right:8px;";
    actionsHeaderTitleDiv.parentElement?.insertBefore(iconSpan, actionsHeaderTitleDiv);
  }
  
  actionsContent.innerHTML = `
    <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 12px;">
      <button class="cxBtn" style="justify-content: flex-start; padding: 12px 16px; background:#37373d; color:white; border:1px solid #3e3e3e; border-radius:8px; cursor:pointer; font-weight:600;" onclick="window.__resetBrand?.()">
        <span style="margin-right: 8px;">🔄</span> Réinitialiser le branding
      </button>
      <button class="cxBtn" style="justify-content: flex-start; padding: 12px 16px; background:#37373d; color:white; border:1px solid #3e3e3e; border-radius:8px; cursor:pointer; font-weight:600;" onclick="window.__exportBrand?.()">
        <span style="margin-right: 8px;">📥</span> Exporter la configuration
      </button>
      <button class="cxBtn" style="justify-content: flex-start; padding: 12px 16px; background:#37373d; color:white; border:1px solid #3e3e3e; border-radius:8px; cursor:pointer; font-weight:600;" onclick="window.__importBrand?.()">
        <span style="margin-right: 8px;">📤</span> Importer la configuration
      </button>
    </div>
  `;
  cardContent.appendChild(actionsSection);

  // Gestionnaires d'événements
  const appDisplayName = root.querySelector<HTMLInputElement>("#app-display-name");
  const appShortName = root.querySelector<HTMLInputElement>("#app-short-name");
  const appLegalName = root.querySelector<HTMLInputElement>("#app-legal-name");
  const appTitleSuffix = root.querySelector<HTMLInputElement>("#app-title-suffix");
  const saveAppName = root.querySelector<HTMLButtonElement>("#save-app-name");

  const logoDarkUrl = root.querySelector<HTMLInputElement>("#logo-dark-url");
  const logoLightUrl = root.querySelector<HTMLInputElement>("#logo-light-url");
  const logoDarkFile = root.querySelector<HTMLInputElement>("#logo-dark-file");
  const logoLightFile = root.querySelector<HTMLInputElement>("#logo-light-file");
  const logoDarkPreview = root.querySelector<HTMLImageElement>("#logo-dark-preview");
  const logoLightPreview = root.querySelector<HTMLImageElement>("#logo-light-preview");
  const saveLogos = root.querySelector<HTMLButtonElement>("#save-logos");

  const themeMode = root.querySelector<HTMLSelectElement>("#theme-mode");
  const accentColor = root.querySelector<HTMLInputElement>("#accent-color");
  const accentColorText = root.querySelector<HTMLInputElement>("#accent-color-text");
  const saveTheme = root.querySelector<HTMLButtonElement>("#save-theme");

  const tenantId = root.querySelector<HTMLInputElement>("#tenant-id");
  const saveAdvanced = root.querySelector<HTMLButtonElement>("#save-advanced");

  // Synchroniser les inputs de couleur
  if (accentColor && accentColorText) {
    accentColor.oninput = () => {
      if (accentColorText) accentColorText.value = accentColor.value;
    };
    accentColorText.oninput = () => {
      if (accentColor && /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/i.test(accentColorText.value)) {
        accentColor.value = accentColorText.value;
      }
    };
  }

  // Gestion des fichiers de logo
  function handleLogoFile(fileInput: HTMLInputElement, preview: HTMLImageElement, urlInput: HTMLInputElement, isLight: boolean): void {
    fileInput.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        if (urlInput) urlInput.value = dataUrl;
        if (preview) {
          preview.src = dataUrl;
          preview.style.opacity = "0";
          setTimeout(() => {
            preview.style.transition = "opacity 0.3s ease-in-out";
            preview.style.opacity = "1";
          }, 10);
        }
      };
      reader.readAsDataURL(file);
    };
  }

  if (logoDarkFile && logoDarkPreview && logoDarkUrl) {
    handleLogoFile(logoDarkFile, logoDarkPreview, logoDarkUrl, false);
  }
  if (logoLightFile && logoLightPreview && logoLightUrl) {
    handleLogoFile(logoLightFile, logoLightPreview, logoLightUrl, true);
  }

  // Mise à jour des previews lors de la saisie d'URL
  if (logoDarkUrl && logoDarkPreview) {
    logoDarkUrl.oninput = () => {
      if (logoDarkPreview && logoDarkUrl.value) {
        logoDarkPreview.src = logoDarkUrl.value;
        logoDarkPreview.style.opacity = "0";
        setTimeout(() => {
          logoDarkPreview.style.transition = "opacity 0.3s ease-in-out";
          logoDarkPreview.style.opacity = "1";
        }, 10);
      }
    };
  }
  if (logoLightUrl && logoLightPreview) {
    logoLightUrl.oninput = () => {
      if (logoLightPreview && logoLightUrl.value) {
        logoLightPreview.src = logoLightUrl.value;
        logoLightPreview.style.opacity = "0";
        setTimeout(() => {
          logoLightPreview.style.transition = "opacity 0.3s ease-in-out";
          logoLightPreview.style.opacity = "1";
        }, 10);
      }
    };
  }

  // Sauvegarder le nom de l'application
  if (saveAppName) {
    saveAppName.onclick = () => {
      const patch: Partial<Brand> = {
        APP_DISPLAY_NAME: appDisplayName?.value || "",
        APP_SHORT_NAME: appShortName?.value || "",
        LEGAL_NAME: appLegalName?.value || "",
        TITLE_SUFFIX: appTitleSuffix?.value || "",
      };
      const result = setBrandLocalOverride(patch);
      if (result.ok) {
        alert("✅ Modifications enregistrées avec succès!");
        // Mettre à jour le titre de la page
        document.title = `${patch.APP_DISPLAY_NAME || "iCONTROL"}${patch.TITLE_SUFFIX ? " " + patch.TITLE_SUFFIX : ""}`;
        location.reload();
      } else {
        alert("❌ Erreur: " + result.warnings.join(", "));
      }
    };
  }

  // Sauvegarder les logos
  if (saveLogos) {
    saveLogos.onclick = () => {
      const patch: Partial<Brand & { LOGO_LIGHT?: string; LOGO_DARK?: string }> = {
        LOGO_LIGHT: logoLightUrl?.value || "",
        LOGO_DARK: logoDarkUrl?.value || "",
        LOGO_PRIMARY: currentTheme === "dark" ? (logoDarkUrl?.value || "") : (logoLightUrl?.value || ""),
      };
      const result = setBrandLocalOverride(patch as Partial<Brand>);
      if (result.ok) {
        alert("✅ Logos enregistrés avec succès!");
        updateAllLogos();
        location.reload();
      } else {
        alert("❌ Erreur: " + result.warnings.join(", "));
      }
    };
  }

  // Sauvegarder le thème
  if (saveTheme) {
    saveTheme.onclick = () => {
      const patch: Partial<Brand> = {
        THEME_MODE: (themeMode?.value as "dark" | "light" | "auto") || "dark",
        ACCENT_COLOR: accentColor?.value || "#6D28D9",
      };
      const result = setBrandLocalOverride(patch);
      if (result.ok) {
        localStorage.setItem("icontrol_theme_mode", patch.THEME_MODE || "dark");
        alert("✅ Thème enregistré avec succès!");
        updateAllLogos();
        location.reload();
      } else {
        alert("❌ Erreur: " + result.warnings.join(", "));
      }
    };
  }

  // Sauvegarder les paramètres avancés
  if (saveAdvanced) {
    saveAdvanced.onclick = () => {
      const patch: Partial<Brand> = {
        TENANT_ID: tenantId?.value || "",
      };
      const result = setBrandLocalOverride(patch);
      if (result.ok) {
        alert("✅ Paramètres avancés enregistrés avec succès!");
        location.reload();
      } else {
        alert("❌ Erreur: " + result.warnings.join(", "));
      }
    };
  }

  // Actions rapides
  (window as any).__resetBrand = () => {
    if (confirm("Êtes-vous sûr de vouloir réinitialiser toutes les configurations de branding ?")) {
      localStorage.removeItem("icontrol_brand_v1");
      alert("✅ Branding réinitialisé!");
      location.reload();
    }
  };

  (window as any).__exportBrand = () => {
    const brand = getBrand();
    const dataStr = JSON.stringify(brand, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "icontrol-brand-config.json";
    link.click();
    URL.revokeObjectURL(url);
  };

  (window as any).__importBrand = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          const result = setBrandLocalOverride(imported);
          if (result.ok) {
            alert("✅ Configuration importée avec succès!");
            location.reload();
          } else {
            alert("❌ Erreur: " + result.warnings.join(", "));
          }
        } catch (e) {
          alert("❌ Erreur lors de l'import: " + String(e));
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // Mettre à jour le logo au chargement
  updateAllLogos();
}
