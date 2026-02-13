// @ts-nocheck
export type MainSystemModule = {
  id: string;
  label: string;
  type: "core" | "module";
  routes: string[];
  menu: Array<{ id: string; label: string; roles: string[] }>;
  roles: string[];
  namespaces: string[];
  activeDefault: boolean;
};

export const MAIN_SYSTEM_MODULES: MainSystemModule[] = [
  {
    id: "CORE_SYSTEM",
    label: "CORE",
    type: "core",
    routes: ["dashboard", "account", "parametres", "audit", "theme-studio", "tenants", "providers", "policies", "security", "developer", "selfcheck"],
    menu: [
      { id: "dashboard", label: "DASHBOARD", roles: ["SYSADMIN", "DEVELOPER", "ADMIN"] },
      { id: "parametres", label: "PARAMETRES", roles: ["SYSADMIN", "DEVELOPER", "ADMIN"] },
      { id: "audit", label: "AUDIT", roles: ["SYSADMIN", "DEVELOPER", "ADMIN"] },
      { id: "theme-studio", label: "THEME STUDIO", roles: ["SYSADMIN", "DEVELOPER", "ADMIN"] },
      { id: "tenants", label: "TENANTS", roles: ["SYSADMIN", "DEVELOPER", "ADMIN"] },
      { id: "providers", label: "PROVIDERS", roles: ["SYSADMIN", "DEVELOPER"] },
      { id: "policies", label: "POLICIES", roles: ["SYSADMIN", "DEVELOPER"] },
      { id: "security", label: "SECURITE", roles: ["SYSADMIN", "DEVELOPER"] },
      { id: "developer", label: "DEVELOPPEUR", roles: ["SYSADMIN", "DEVELOPER"] }
    ],
    roles: ["SYSADMIN", "DEVELOPER", "ADMIN"],
    namespaces: ["icontrol_*"],
    activeDefault: true
  },
  {
    id: "SYSTEM_LOGS",
    label: "SYSTEME",
    type: "module",
    routes: ["system", "logs"],
    menu: [
      { id: "system", label: "SYSTEME", roles: ["SYSADMIN", "DEVELOPER", "ADMIN"] },
      { id: "logs", label: "LOGS", roles: ["SYSADMIN", "DEVELOPER", "ADMIN"] }
    ],
    roles: ["SYSADMIN", "DEVELOPER", "ADMIN"],
    namespaces: ["system_logs_*"],
    activeDefault: true
  },
  {
    id: "DOCS_OCR",
    label: "DOCUMENTS",
    type: "module",
    routes: ["docs"],
    menu: [
      { id: "docs", label: "DOCUMENTS", roles: ["ADMIN", "SYSADMIN", "DEVELOPER"] }
    ],
    roles: ["ADMIN", "SYSADMIN", "DEVELOPER"],
    namespaces: ["docs_ocr_*"],
    activeDefault: false
  }
];

export const MAIN_SYSTEM_ENABLED = ["CORE_SYSTEM", "SYSTEM_LOGS"];

export const MAIN_SYSTEM_PERMISSIONS: Record<string, Record<string, string[]>> = {
  CORE_SYSTEM: {
    SYSADMIN: ["READ", "WRITE", "GOVERN"],
    DEVELOPER: ["READ", "WRITE"],
    ADMIN: ["READ"]
  },
};

export const MAIN_SYSTEM_LAYOUT = {
  topbarHeight: 74,
  drawerWidth: 320,
  maxWidth: 1220,
  pagePadding: 18,
  menuOrder: [
    "/dashboard",
    "/regles-ocr",
    "/audit",
    "/system",
    "/logs",
    "/users",
    "/parametres",
    "/theme-studio",
    "/tenants",
    "/providers",
    "/policies",
    "/security",
    "/account",
    "/developer"
  ]
};

export const MAIN_SYSTEM_THEME = {
  tokens: {
    titleSize: 42,
    radius: 16,
    border: "#3a3a3a",
    bg: "#1f1f1f",
    panel: "#2b2b2b",
    card: "#2f2f2f",
    text: "#e9e9e9",
    mutedText: "#a9a9a9",
    accent: "#b9d94a",
    accent2: "#94b83b",
    shadow: "0 14px 30px rgba(0,0,0,.35)",
    font: "system-ui, -apple-system, Segoe UI, Roboto, Arial, sans-serif",
    mono: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace"
  },
  logos: {
    light: "",
    dark: ""
  }
};

export const MAIN_SYSTEM_TABLE_CONTRACT = {
  columnFields: ["id", "key", "label", "type", "rules", "visibleForRoles", "format", "width", "align", "computed"],
  columnTypes: ["text", "date", "money", "badge", "action"],
  actionTypes: ["navigate", "openModal", "exportCsv", "noop"]
};

export const MAIN_SYSTEM_FORM_CONTRACT = {
  fieldTypes: ["text", "textarea", "date", "money", "email", "phone", "select", "checkbox"],
  validation: ["required", "regex", "range"],
  roleVisibility: "visibleForRoles"
};

export const MAIN_SYSTEM_DATASOURCES = {
  types: ["static", "localStorage", "files", "logs", "api_stub"],
  queryOps: ["eq", "contains", "gt", "lt"],
  sortDirs: ["asc", "desc"]
};

export const MAIN_SYSTEM_RULES = {
  valueRefs: ["const", "role", "flag:SAFE_MODE", "setting:language", "setting:theme", "field:*", "storage:*"],
  conditions: ["all", "any", "not", "eq", "exists"],
  effects: ["setVisible", "disable"],
  storageAllow: ["icontrol_iam_v1.role", "icontrol_settings_v1.language", "icontrol_settings_v1.theme"]
};
