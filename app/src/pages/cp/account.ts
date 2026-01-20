/**
 * ICONTROL_CP_ACCOUNT_V2
 * SSOT Account page (CP)
 */
import { coreBaseStyles } from "../../../../modules/core-system/ui/frontend-ts/shared/coreStyles";
import { renderAccessDenied } from "/src/core/runtime/accessDenied";
import { OBS } from "/src/core/runtime/obs";
import { recordObs } from "/src/core/runtime/audit";
import { requireSession } from "/src/localAuth";
import { getRole, canAccessPageRoute } from "/src/runtime/rbac";
import { getAvatarConfig, setAvatarConfig, getInitials, type AvatarConfig } from "/src/core/user/avatarManager";
import { getUserPublicInfo } from "/src/core/security/userData";
import { createPageShell } from "/src/core/ui/pageShell";
import { createSectionCard } from "/src/core/ui/sectionCard";
import { createToolbar } from "/src/core/ui/toolbar";
import { createBadge } from "/src/core/ui/badge";
import { createErrorState } from "/src/core/ui/errorState";
import { createContextualEmptyState } from "/src/core/ui/emptyState";
import { createDataTable, type TableColumn } from "/src/core/ui/dataTable";
import { showToast } from "/src/core/ui/toast";
import { createCardSkeleton } from "/src/core/ui/skeletonLoader";
import { getMountEl } from "/src/router";
import { safeRender, fetchJsonSafe, mapSafeMode, getSafeMode } from "/src/core/runtime/safe";

type AccountMode = "live" | "demo" | "error";

type AccountProfile = {
  username: string;
  role: string;
  email: string;
  fullName: string;
  tenant: string;
  lastLogin: string;
};

type AccountSecurity = {
  mfaEnabled: boolean;
  activeSessions: number;
  lastActivity: string;
  riskLevel: "LOW" | "MEDIUM" | "HIGH";
};

type AccountRow = {
  key: string;
  value: string;
  domain: "profile" | "security" | "session" | "demo";
  updatedAt?: string;
};

type AccountData = {
  profile: AccountProfile;
  security: AccountSecurity;
  rows: AccountRow[];
  lastUpdated: string;
};

let currentRoot: HTMLElement | null = null;

function renderAccountLegacy(root: HTMLElement): void {
  void renderAccountPageAsync(root);
}

export function renderAccountPage(root: HTMLElement): void {
  void renderAccountPageAsync(root);
}

async function renderAccountPageAsync(root: HTMLElement): Promise<void> {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccessPageRoute("account")) {
    recordObs({ code: OBS.WARN_SECTION_BLOCKED, page: "account", section: "page", detail: "rbac" });
    renderAccessDenied(root, "RBAC_PAGE_BLOCKED");
    return;
  }

  currentRoot = root;

  const renderLoading = () => {
    safeRender(root, () => {
      root.innerHTML = coreBaseStyles();
      const safeModeValue = mapSafeMode(safeMode);
      const { shell, content } = createPageShell({
        title: "Compte",
        subtitle: "Profil utilisateur, securite et preferences",
        safeMode: safeModeValue,
        statusBadge: { label: "CHARGEMENT", tone: "info" }
      });

      const grid = document.createElement("div");
  grid.style.minWidth = "0";
  grid.style.boxSizing = "border-box";
      grid.style.cssText = "display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; width:100%;";
      grid.appendChild(createCardSkeleton());
      grid.appendChild(createCardSkeleton());
      content.appendChild(grid);

      const { card: detailCard, body: detailBody } = createSectionCard({
        title: "Details",
        description: "Informations consolidees"
      });
      detailBody.appendChild(createCardSkeleton());
      content.appendChild(detailCard);

      root.appendChild(shell);
    });
  };

  renderLoading();

  const { data, errors, mode } = await getAccountData(role);
  renderData(root, data, errors, mode, safeMode);
}

function renderData(
  root: HTMLElement,
  data: AccountData,
  errors: { profile?: string; security?: string },
  mode: AccountMode,
  safeModeRaw: string
): void {
  safeRender(root, () => {
    root.innerHTML = coreBaseStyles();
    const safeModeValue = mapSafeMode(safeModeRaw);
    const statusBadge = mode === "live"
      ? { label: "LIVE", tone: "ok" as const }
      : mode === "demo"
        ? { label: "DEMO", tone: "warn" as const }
        : { label: "ERREUR", tone: "err" as const };

    const { shell, content } = createPageShell({
      title: "Compte",
      subtitle: "Profil utilisateur, securite et preferences",
      safeMode: safeModeValue,
      statusBadge
    });

    const grid = document.createElement("div");
    grid.style.cssText = "display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; width:100%;";

    const { card: profileCard, body: profileBody } = createSectionCard({
      title: "Profil",
      description: "Informations publiques et avatar"
    });

    if (errors.profile) {
      profileBody.appendChild(createErrorState({ code: "ERR_ACCOUNT_PROFILE", message: errors.profile }));
    }

    const avatarSection = buildAvatarSection(data.profile.username);
    profileBody.appendChild(avatarSection);
    profileBody.appendChild(createKpiRow("Utilisateur", data.profile.username, "neutral"));
    profileBody.appendChild(createKpiRow("Role", data.profile.role, "neutral"));
    profileBody.appendChild(createKpiRow("Email", data.profile.email || "Non renseigne", data.profile.email ? "ok" : "warn"));
    profileBody.appendChild(createKpiRow("Nom complet", data.profile.fullName || "Non renseigne", data.profile.fullName ? "ok" : "warn"));
    profileBody.appendChild(createKpiRow("Tenant", data.profile.tenant || "N/A", "neutral"));
    profileBody.appendChild(createKpiRow("Derniere connexion", formatDateTime(data.profile.lastLogin), "neutral"));

    grid.appendChild(profileCard);

    const { card: securityCard, body: securityBody } = createSectionCard({
      title: "Securite",
      description: "Sessions actives et politiques"
    });

    if (errors.security) {
      securityBody.appendChild(createErrorState({ code: "ERR_ACCOUNT_SECURITY", message: errors.security }));
    }

    securityBody.appendChild(createKpiRow("2FA", data.security.mfaEnabled ? "ACTIVE" : "INACTIVE", data.security.mfaEnabled ? "ok" : "warn"));
    securityBody.appendChild(createKpiRow("Sessions actives", String(data.security.activeSessions), data.security.activeSessions > 1 ? "warn" : "ok"));
    securityBody.appendChild(createKpiRow("Derniere activite", formatDateTime(data.security.lastActivity), "neutral"));
    securityBody.appendChild(createKpiRow("Risque", data.security.riskLevel, data.security.riskLevel === "HIGH" ? "err" : data.security.riskLevel === "MEDIUM" ? "warn" : "ok"));

    grid.appendChild(securityCard);

    content.appendChild(grid);

    const { card: detailCard, body: detailBody } = createSectionCard({
      title: "Details",
      description: "Preferences et attributs associes"
    });

    const tableState = { search: "", domain: "" };
    const tableContainer = document.createElement("div");

    const { element: toolbar, searchInput } = createToolbar({
      searchPlaceholder: "Rechercher cle, valeur...",
      onSearch: (value) => {
        tableState.search = value.toLowerCase().trim();
        renderTable();
      },
      filters: [
        {
          label: "Domaine",
          options: [
            { label: "Tous", value: "" },
            { label: "Profil", value: "profile" },
            { label: "Securite", value: "security" },
            { label: "Session", value: "session" },
            { label: "Demo", value: "demo" }
          ],
          onChange: (value) => {
            tableState.domain = value;
            renderTable();
          }
        }
      ],
      actions: [
        { label: "Rafraichir", primary: true, onClick: () => refreshAccount() },
        { label: "Exporter JSON", onClick: () => exportJson(getFilteredRows(data.rows, tableState)) }
      ]
    });

    detailBody.appendChild(toolbar);
    detailBody.appendChild(tableContainer);

    const columns: TableColumn<AccountRow>[] = [
      { key: "key", label: "Cle", sortable: true },
      {
        key: "value",
        label: "Valeur",
        sortable: false,
        render: (value) => {
          const div = document.createElement("div");
          div.textContent = String(value);
          div.style.cssText = "font-size:12px;color:var(--ic-text,#e7ecef);";
          return div;
        }
      },
      {
        key: "domain",
        label: "Domaine",
        sortable: true,
        render: (value) => createBadge(String(value), "neutral")
      },
      {
        key: "updatedAt",
        label: "Maj",
        sortable: true,
        render: (value) => {
          const div = document.createElement("div");
          div.textContent = value ? formatDateTime(String(value)) : "—";
          div.style.cssText = "font-size:11px;color:var(--ic-mutedText,#a7b0b7);";
          return div;
        }
      }
    ];

    const renderTable = () => {
      tableContainer.innerHTML = "";
      const filtered = getFilteredRows(data.rows, tableState);
      const table = createDataTable({
        columns,
        data: filtered,
        searchable: false,
        sortable: true,
        pagination: true,
        pageSize: 10,
        actions: (row) => [
          {
            label: "Copier cle",
            onClick: () => copyToClipboard(row.key)
          },
          {
            label: "Copier valeur",
            onClick: () => copyToClipboard(row.value)
          },
          {
            label: "Details",
            onClick: () => showToast({ status: "info", message: `${row.key}: ${row.value}` })
          }
        ]
      });

      tableContainer.appendChild(table);

      if (filtered.length === 0) {
        tableContainer.appendChild(createContextualEmptyState("account", {
          onAdd: () => refreshAccount(),
          onClearFilter: () => {
            tableState.search = "";
            tableState.domain = "";
            if (searchInput) searchInput.value = "";
            renderTable();
          }
        }));
      }
    };

    renderTable();

    content.appendChild(detailCard);
    root.appendChild(shell);
  });
}

function buildAvatarSection(username: string): HTMLElement {
  const wrapper = document.createElement("div");
  wrapper.style.cssText = "display:flex; flex-direction:column; gap:12px; margin-bottom:12px;";

  const config = getAvatarConfig(username);
  const preview = document.createElement("div");
  preview.style.cssText = "width:96px;height:96px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;color:white;border:2px solid var(--ic-border,#2b3136);overflow:hidden;";

  const updatePreview = (next: AvatarConfig) => {
    preview.innerHTML = "";
    if (next.type === "image" && next.imageUrl) {
      preview.style.background = `url(${next.imageUrl}) center/cover`;
    } else {
      preview.style.background = next.color || "#6D28D9";
      preview.textContent = getInitials(username);
    }
  };

  updatePreview(config);

  const typeSelect = document.createElement("select");
  typeSelect.innerHTML = "<option value=\"color\">Couleur</option><option value=\"image\">Image</option>";
  typeSelect.value = config.type;
  typeSelect.style.cssText = "padding:6px 10px;border-radius:8px;border:1px solid var(--ic-border,#2b3136);background:#121516;color:var(--ic-text,#e7ecef);font-size:12px;";

  const colorInput = document.createElement("input");
  colorInput.type = "color";
  colorInput.value = config.color || "#6D28D9";
  colorInput.style.cssText = "width:48px;height:32px;border:none;background:transparent;";

  const colorText = document.createElement("input");
  colorText.type = "text";
  colorText.value = config.color || "#6D28D9";
  colorText.placeholder = "#6D28D9";
  colorText.style.cssText = "flex:1;padding:6px 10px;border-radius:8px;border:1px solid var(--ic-border,#2b3136);background:#121516;color:var(--ic-text,#e7ecef);font-size:12px;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,\"Liberation Mono\",\"Courier New\",monospace;";

  const imageInput = document.createElement("input");
  imageInput.type = "text";
  imageInput.value = config.imageUrl || "";
  imageInput.placeholder = "https://...";
  imageInput.style.cssText = "padding:6px 10px;border-radius:8px;border:1px solid var(--ic-border,#2b3136);background:#121516;color:var(--ic-text,#e7ecef);font-size:12px;";

  const saveBtn = document.createElement("button");
  saveBtn.type = "button";
  saveBtn.textContent = "Enregistrer l'avatar";
  saveBtn.style.cssText = "padding:8px 12px;border-radius:8px;border:1px solid var(--ic-border,#2b3136);background:var(--ic-panel,#1a1d1f);color:var(--ic-text,#e7ecef);font-weight:600;font-size:12px;cursor:pointer;";

  const syncConfig = () => {
    const next: AvatarConfig = {
      type: typeSelect.value as AvatarConfig["type"],
      color: colorText.value,
      imageUrl: imageInput.value
    };
    updatePreview(next);
    return next;
  };

  typeSelect.addEventListener("change", () => {
    const next = syncConfig();
    const isImage = next.type === "image";
    colorInput.style.display = isImage ? "none" : "inline-block";
    colorText.style.display = isImage ? "none" : "inline-block";
    imageInput.style.display = isImage ? "block" : "none";
  });

  colorInput.addEventListener("input", () => {
    colorText.value = colorInput.value;
    syncConfig();
  });

  colorText.addEventListener("input", () => {
    colorInput.value = colorText.value;
    syncConfig();
  });

  imageInput.addEventListener("input", () => {
    syncConfig();
  });

  saveBtn.addEventListener("click", () => {
    const next = syncConfig();
    setAvatarConfig(username, next);
    showToast({ status: "success", message: "Avatar enregistre." });
  });

  const row = document.createElement("div");
  row.style.cssText = "display:flex; gap:8px; align-items:center;";
  row.appendChild(typeSelect);
  row.appendChild(colorInput);
  row.appendChild(colorText);

  wrapper.appendChild(preview);
  wrapper.appendChild(row);
  wrapper.appendChild(imageInput);
  wrapper.appendChild(saveBtn);

  const initialType = config.type === "image";
  colorInput.style.display = initialType ? "none" : "inline-block";
  colorText.style.display = initialType ? "none" : "inline-block";
  imageInput.style.display = initialType ? "block" : "none";

  return wrapper;
}



function createKpiRow(label: string, value: string, tone: "ok" | "warn" | "err" | "neutral"): HTMLElement {
  const row = document.createElement("div");
  row.style.cssText = "display:flex; align-items:center; justify-content:space-between; gap:12px;";
  const left = document.createElement("div");
  left.textContent = label;
  left.style.cssText = "font-size:12px;color:var(--ic-mutedText,#a7b0b7);";
  const right = document.createElement("div");
  right.textContent = value;
  right.style.cssText = `font-size:13px;font-weight:600;color:${tone === "err" ? "var(--ic-error,#f48771)" : tone === "warn" ? "var(--ic-warn,#f59e0b)" : tone === "ok" ? "var(--ic-success,#4ec9b0)" : "var(--ic-text,#e7ecef)"};`;
  row.appendChild(left);
  row.appendChild(right);
  return row;
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("fr-CA");
}

async function getAccountData(role: string): Promise<{ data: AccountData; errors: { profile?: string; security?: string }; mode: AccountMode }> {
  const session = requireSession();
  const demo = buildDemoAccountData(session.username, role);
  const errors: { profile?: string; security?: string } = {};
  let mode: AccountMode = "demo";
  let profile = demo.profile;
  let security = demo.security;
  let rows = demo.rows;

  const profileRes = await fetchJsonSafe<any>("/api/cp/account");
  if (profileRes.ok && profileRes.data) {
    profile = normalizeProfile(profileRes.data, demo.profile, session.username, role);
    mode = "live";
  } else if (profileRes.error) {
    errors.profile = profileRes.error;
  }

  const securityRes = await fetchJsonSafe<any>("/api/cp/security");
  if (securityRes.ok && securityRes.data) {
    security = normalizeSecurity(securityRes.data, demo.security);
    mode = "live";
  } else if (securityRes.error) {
    errors.security = securityRes.error;
  }

  const sessionsRes = await fetchJsonSafe<any>("/api/cp/sessions?limit=12");
  if (sessionsRes.ok && sessionsRes.data) {
    const count = Array.isArray(sessionsRes.data?.rows) ? sessionsRes.data.rows.length : Array.isArray(sessionsRes.data) ? sessionsRes.data.length : demo.security.activeSessions;
    security = { ...security, activeSessions: count };
    mode = "live";
  }

  rows = buildRows(profile, security);

  if (mode !== "live") {
    const publicInfo = getUserPublicInfo(session.username);
    if (publicInfo?.email || publicInfo?.fullName) {
      profile = {
        ...profile,
        email: publicInfo.email || profile.email,
        fullName: publicInfo.fullName || profile.fullName
      };
      rows = buildRows(profile, security);
    }
  }

  if (!profileRes.ok && !securityRes.ok && !sessionsRes.ok) {
    mode = "error";
  }

  return {
    data: {
      profile,
      security,
      rows,
      lastUpdated: new Date().toISOString()
    },
    errors,
    mode
  };
}

function normalizeProfile(raw: any, fallback: AccountProfile, username: string, role: string): AccountProfile {
  return {
    username: String(raw.username || fallback.username || username),
    role: String(raw.role || fallback.role || role),
    email: String(raw.email || fallback.email || ""),
    fullName: String(raw.fullName || raw.name || fallback.fullName || ""),
    tenant: String(raw.tenant || raw.organization || fallback.tenant || ""),
    lastLogin: String(raw.lastLogin || raw.lastSeen || fallback.lastLogin)
  };
}

function normalizeSecurity(raw: any, fallback: AccountSecurity): AccountSecurity {
  return {
    mfaEnabled: Boolean(raw.mfaEnabled ?? raw.mfa ?? fallback.mfaEnabled),
    activeSessions: Number(raw.activeSessions || raw.sessions || fallback.activeSessions),
    lastActivity: String(raw.lastActivity || raw.lastSeen || fallback.lastActivity),
    riskLevel: String(raw.riskLevel || fallback.riskLevel).toUpperCase() as AccountSecurity["riskLevel"]
  };
}

function buildDemoAccountData(username: string, role: string): AccountData {
  const now = Date.now();
  const lastLogin = new Date(now - 1000 * 60 * 45).toISOString();
  const profile: AccountProfile = {
    username,
    role: username === "Master" ? "MASTER" : role,
    email: "",
    fullName: "",
    tenant: "CP",
    lastLogin
  };
  const security: AccountSecurity = {
    mfaEnabled: false,
    activeSessions: 1,
    lastActivity: new Date(now - 1000 * 60 * 8).toISOString(),
    riskLevel: "LOW"
  };
  const rows = buildRows(profile, security);
  return { profile, security, rows, lastUpdated: new Date(now).toISOString() };
}

function buildRows(profile: AccountProfile, security: AccountSecurity): AccountRow[] {
  return [
    { key: "username", value: profile.username, domain: "profile", updatedAt: profile.lastLogin },
    { key: "role", value: profile.role, domain: "profile", updatedAt: profile.lastLogin },
    { key: "email", value: profile.email || "—", domain: "profile", updatedAt: profile.lastLogin },
    { key: "fullName", value: profile.fullName || "—", domain: "profile", updatedAt: profile.lastLogin },
    { key: "tenant", value: profile.tenant || "—", domain: "profile", updatedAt: profile.lastLogin },
    { key: "mfaEnabled", value: security.mfaEnabled ? "ON" : "OFF", domain: "security", updatedAt: security.lastActivity },
    { key: "activeSessions", value: String(security.activeSessions), domain: "security", updatedAt: security.lastActivity },
    { key: "riskLevel", value: security.riskLevel, domain: "security", updatedAt: security.lastActivity }
  ];
}

function getFilteredRows(rows: AccountRow[], state: { search: string; domain: string }): AccountRow[] {
  const q = state.search;
  return rows.filter((row) => {
    const matchDomain = !state.domain || row.domain === state.domain;
    const matchSearch = !q ||
      row.key.toLowerCase().includes(q) ||
      row.value.toLowerCase().includes(q) ||
      row.domain.toLowerCase().includes(q);
    return matchDomain && matchSearch;
  });
}

function exportJson(rows: AccountRow[]): void {
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `icontrol_cp_account_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function copyToClipboard(text: string): Promise<void> {
  if (!text) {
    showToast({ status: "warning", message: "Aucune valeur a copier." });
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast({ status: "success", message: "Copie reussie." });
  } catch {
    showToast({ status: "warning", message: "Copie impossible (permissions navigateur)." });
  }
}

function refreshAccount(): void {
  const target = currentRoot || getMountEl();
  if (target) void renderAccountPageAsync(target);
}
