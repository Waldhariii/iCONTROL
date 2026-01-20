/**
 * ICONTROL_CP_VERIFICATION_V2
 * SSOT Verification page (CP)
 */
import { getRole } from "/src/runtime/rbac";
import { renderAccessDenied } from "/src/core/runtime/accessDenied";
import { OBS } from "/src/core/runtime/obs";
import { recordObs } from "/src/core/runtime/audit";
import { safeRender, fetchJsonSafe, mapSafeMode, getSafeMode } from "/src/core/runtime/safe";
import { canAccess } from "./contract";

import { coreBaseStyles } from "../../shared/coreStyles";
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
import { navigate } from "/src/runtime/navigate";

type VerificationStatus = "PASS" | "WARN" | "FAIL";

type VerificationRow = {
  id: string;
  name: string;
  status: VerificationStatus;
  severity: "INFO" | "WARN" | "ERR";
  detail: string;
  updatedAt?: string;
  correlationId?: string;
  source?: string;
};

type VerificationData = {
  rows: VerificationRow[];
  lastRun: string;
  durationMs: number;
  lastUpdated: string;
};

type Mode = "live" | "demo" | "error";

let currentRoot: HTMLElement | null = null;

export function renderVerificationPage(root: HTMLElement): void {
  void renderVerificationPageAsync(root);
}

async function renderVerificationPageAsync(root: HTMLElement): Promise<void> {
  const role = getRole();
  const safeMode = getSafeMode();

  if (!canAccess(role, safeMode)) {
    recordObs({ code: OBS.WARN_SECTION_BLOCKED, page: "verification", section: "page", detail: "rbac" });
    renderAccessDenied(root, "RBAC_PAGE_BLOCKED");
    return;
  }

  currentRoot = root;

  const renderLoading = () => {
    safeRender(root, () => {
      root.innerHTML = coreBaseStyles();
      const { shell, content } = createPageShell({
        title: "Verification",
        subtitle: "Checks de conformite et etat runtime",
        safeMode: mapSafeMode(safeMode),
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
        title: "Resultats",
        description: "Chargement..."
      });
      detailBody.appendChild(createCardSkeleton());
      content.appendChild(detailCard);

      root.appendChild(shell);
    });
  };

  renderLoading();

  const { data, error, mode } = await getVerificationData();
  renderData(root, data, error, mode);
}

function renderData(root: HTMLElement, data: VerificationData, error: string | null, mode: Mode): void {
  safeRender(root, () => {
    root.innerHTML = coreBaseStyles();

    const statusBadge = mode === "live"
      ? { label: "LIVE", tone: "ok" as const }
      : mode === "demo"
        ? { label: "DEMO", tone: "warn" as const }
        : { label: "ERREUR", tone: "err" as const };

    const { shell, content } = createPageShell({
      title: "Verification",
      subtitle: "Checks de conformite et etat runtime",
      safeMode: mapSafeMode(getSafeMode()),
      statusBadge
    });

    const grid = document.createElement("div");
    grid.style.cssText = "display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; width:100%;";

    const total = data.rows.length;
    const pass = data.rows.filter((r) => r.status === "PASS").length;
    const warn = data.rows.filter((r) => r.status === "WARN").length;
    const fail = data.rows.filter((r) => r.status === "FAIL").length;

    const { card: checksCard, body: checksBody } = createSectionCard({
      title: "Checks",
      description: "Etat global des verifications"
    });
    if (error) {
      checksBody.appendChild(createErrorState({ code: "ERR_VERIFICATION_FETCH", message: error }));
    }
    checksBody.appendChild(createKpiRow("PASS", `${pass}/${total}`, pass === total ? "ok" : "warn"));
    checksBody.appendChild(createKpiRow("WARN", String(warn), warn > 0 ? "warn" : "ok"));
    checksBody.appendChild(createKpiRow("FAIL", String(fail), fail > 0 ? "err" : "ok"));
    grid.appendChild(checksCard);

    const { card: lastRunCard, body: lastRunBody } = createSectionCard({
      title: "Dernier run",
      description: "Execution la plus recente"
    });
    lastRunBody.appendChild(createKpiRow("Timestamp", formatDateTime(data.lastRun)));
    lastRunBody.appendChild(createKpiRow("Duree", `${Math.round(data.durationMs)} ms`, data.durationMs > 1200 ? "warn" : "ok"));
    lastRunBody.appendChild(createKpiRow("Correlation", data.rows[0]?.correlationId || "—"));
    grid.appendChild(lastRunCard);

    content.appendChild(grid);

    const { card: detailCard, body: detailBody } = createSectionCard({
      title: "Resultats",
      description: "Liste des checks (recherche + filtres)"
    });

    const state = { search: "", status: "", severity: "" };
    const tableContainer = document.createElement("div");

    const { element: toolbar, searchInput } = createToolbar({
      searchPlaceholder: "Rechercher check, detail, correlationId...",
      onSearch: (v) => {
        state.search = (v || "").toLowerCase().trim();
        renderTable();
      },
      filters: [
        {
          label: "Status",
          options: [
            { label: "Tous", value: "" },
            { label: "PASS", value: "PASS" },
            { label: "WARN", value: "WARN" },
            { label: "FAIL", value: "FAIL" }
          ],
          onChange: (v) => {
            state.status = v;
            renderTable();
          }
        },
        {
          label: "Severite",
          options: [
            { label: "Toutes", value: "" },
            { label: "INFO", value: "INFO" },
            { label: "WARN", value: "WARN" },
            { label: "ERR", value: "ERR" }
          ],
          onChange: (v) => {
            state.severity = v;
            renderTable();
          }
        }
      ],
      actions: [
        { label: "Rafraichir", primary: true, onClick: () => refreshVerification() },
        { label: "Exporter JSON", onClick: () => exportJson(data.rows) },
        { label: "Copier CID", onClick: () => copyToClipboard(data.rows[0]?.correlationId || "") }
      ]
    });

    detailBody.appendChild(toolbar);
    detailBody.appendChild(tableContainer);

    const columns: TableColumn<VerificationRow>[] = [
      { key: "name", label: "Check", sortable: true },
      { key: "status", label: "Status", sortable: true, render: (v) => createBadge(String(v), String(v) === "FAIL" ? "err" : String(v) === "WARN" ? "warn" : "ok") },
      { key: "severity", label: "Severite", sortable: true, render: (v) => createBadge(String(v), String(v) === "ERR" ? "err" : String(v) === "WARN" ? "warn" : "info") },
      { key: "detail", label: "Detail", sortable: false, render: (v) => {
          const div = document.createElement("div");
          div.textContent = String(v);
          div.style.cssText = "font-size:12px;color:var(--ic-text,#e7ecef);";
          return div;
        }
      },
      { key: "updatedAt", label: "Updated", sortable: true, render: (v) => {
          const div = document.createElement("div");
          div.textContent = v ? formatDateTime(String(v)) : "—";
          div.style.cssText = "font-size:11px;color:var(--ic-mutedText,#a7b0b7);";
          return div;
        }
      }
    ];

    function renderTable(): void {
      tableContainer.innerHTML = "";
      const filtered = data.rows.filter((row) => {
        const matchStatus = !state.status || row.status === state.status;
        const matchSeverity = !state.severity || row.severity === state.severity;
        const q = state.search;
        const matchSearch = !q || row.name.toLowerCase().includes(q) || row.detail.toLowerCase().includes(q) || (row.correlationId || "").toLowerCase().includes(q);
        return matchStatus && matchSeverity && matchSearch;
      });

      const table = createDataTable({
        columns,
        data: filtered,
        searchable: false,
        sortable: true,
        pagination: true,
        pageSize: 12,
        actions: (row) => [
          { label: "Copier ID", onClick: () => copyToClipboard(row.id) },
          { label: "Copier CID", onClick: () => copyToClipboard(row.correlationId || "") },
          { label: "Voir logs", onClick: () => { navigate("#/logs"); } }
        ]
      });
      tableContainer.appendChild(table);

      if (filtered.length === 0) {
        tableContainer.appendChild(createContextualEmptyState("verification", {
          searchQuery: state.search || undefined,
          onClearFilter: () => {
            state.search = "";
            state.status = "";
            state.severity = "";
            if (searchInput) searchInput.value = "";
            renderTable();
          }
        }));
      }
    }

    renderTable();
    content.appendChild(detailCard);
    root.appendChild(shell);
  });
}

function createKpiRow(label: string, value: string, tone?: "ok" | "warn" | "err"): HTMLElement {
  const row = document.createElement("div");
  row.style.cssText = "display:flex; align-items:center; justify-content:space-between; gap:12px;";
  const left = document.createElement("div");
  left.textContent = label;
  left.style.cssText = "font-size:12px;color:var(--ic-mutedText,#a7b0b7);";
  const right = document.createElement("div");
  right.textContent = value;
  right.style.cssText =
    "font-size:13px;font-weight:600;color:" +
    (tone === "err" ? "var(--ic-error,#f48771)" : tone === "warn" ? "var(--ic-warn,#f59e0b)" : tone === "ok" ? "var(--ic-success,#4ec9b0)" : "var(--ic-text,#e7ecef)") +
    ";";
  row.appendChild(left);
  row.appendChild(right);
  return row;
}

function formatDateTime(value: string): string {
  return new Date(value).toLocaleString("fr-CA");
}

async function getVerificationData(): Promise<{ data: VerificationData; error: string | null; mode: Mode }> {
  const demo = buildDemoRows();
  let rows: VerificationRow[] = [];
  let mode: Mode = "demo";
  let error: string | null = null;

  const verificationRes = await fetchJsonSafe("/api/cp/verification");
  if (verificationRes.ok && verificationRes.data) {
    rows = normalizeVerificationRows(verificationRes.data);
    mode = "live";
  } else if (verificationRes.error) {
    error = verificationRes.error;
  }

  const healthRes = await fetchJsonSafe("/api/cp/health");
  if (healthRes.ok && healthRes.data && rows.length === 0) {
    rows = normalizeHealthRows(healthRes.data);
    mode = "live";
  }

  const systemRes = await fetchJsonSafe("/api/cp/runtime-config");
  if (systemRes.ok && systemRes.data && rows.length === 0) {
    rows = normalizeSystemRows(systemRes.data);
    mode = "live";
  }

  if (rows.length === 0) {
    rows = demo;
    if (error) mode = "error";
  }

  return {
    data: {
      rows,
      lastRun: rows[0]?.updatedAt || new Date().toISOString(),
      durationMs: 620,
      lastUpdated: new Date().toISOString()
    },
    error,
    mode
  };
}

function normalizeVerificationRows(raw: any): VerificationRow[] {
  const list = Array.isArray(raw?.rows) ? raw.rows : Array.isArray(raw) ? raw : [];
  return list.map((item: any, idx: number) => ({
    id: String(item.id || `check-${idx + 1}`),
    name: String(item.name || item.label || "Verification"),
    status: mapStatus(item.status),
    severity: mapSeverity(item.severity || item.level),
    detail: String(item.detail || item.message || "—"),
    updatedAt: item.updatedAt || item.updated_at || new Date().toISOString(),
    correlationId: item.correlationId || item.correlation_id,
    source: item.source || "API"
  }));
}

function normalizeHealthRows(raw: any): VerificationRow[] {
  const rows: VerificationRow[] = [];
  if (raw && typeof raw === "object") {
    for (const [key, value] of Object.entries(raw)) {
      rows.push({
        id: `health-${key}`,
        name: `Health ${key}`,
        status: value ? "PASS" : "WARN",
        severity: value ? "INFO" : "WARN",
        detail: String(value),
        updatedAt: new Date().toISOString(),
        source: "HEALTH"
      });
    }
  }
  return rows;
}

function normalizeSystemRows(raw: any): VerificationRow[] {
  const rows: VerificationRow[] = [];
  if (raw && typeof raw === "object") {
    for (const [key, value] of Object.entries(raw)) {
      rows.push({
        id: `sys-${key}`,
        name: `Runtime ${key}`,
        status: "PASS",
        severity: "INFO",
        detail: String(value),
        updatedAt: new Date().toISOString(),
        source: "RUNTIME"
      });
    }
  }
  return rows;
}

function mapStatus(value: any): VerificationStatus {
  const v = String(value || "PASS").toUpperCase();
  if (v === "FAIL" || v === "ERROR") return "FAIL";
  if (v === "WARN" || v === "WARNING") return "WARN";
  return "PASS";
}

function mapSeverity(value: any): "INFO" | "WARN" | "ERR" {
  const v = String(value || "INFO").toUpperCase();
  if (v === "ERR" || v === "ERROR") return "ERR";
  if (v === "WARN" || v === "WARNING") return "WARN";
  return "INFO";
}

function buildDemoRows(): VerificationRow[] {
  const now = Date.now();
  const mk = (id: number, status: VerificationStatus, severity: "INFO" | "WARN" | "ERR", detail: string): VerificationRow => ({
    id: `check-${id}`,
    name: `Check ${id}`,
    status,
    severity,
    detail,
    updatedAt: new Date(now - id * 1000 * 60 * 3).toISOString(),
    correlationId: `verify-${100 + id}`,
    source: "DEMO"
  });
  return [
    mk(1, "PASS", "INFO", "Schema OK"),
    mk(2, "PASS", "INFO", "Policies OK"),
    mk(3, "WARN", "WARN", "Lag detecte"),
    mk(4, "PASS", "INFO", "Auth OK"),
    mk(5, "PASS", "INFO", "Cache OK"),
    mk(6, "WARN", "WARN", "Retention limite"),
    mk(7, "PASS", "INFO", "SLA OK"),
    mk(8, "FAIL", "ERR", "Audit export KO"),
    mk(9, "PASS", "INFO", "Jobs OK"),
    mk(10, "PASS", "INFO", "Backups OK"),
    mk(11, "WARN", "WARN", "Quota proche"),
    mk(12, "PASS", "INFO", "Network OK")
  ];
}

function exportJson(rows: VerificationRow[]): void {
  const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `icontrol_cp_verification_${new Date().toISOString().slice(0, 19).replace(/[:T]/g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function copyToClipboard(text: string): Promise<void> {
  if (!text) {
    showToast({ status: "warning", message: "Aucun identifiant a copier." });
    return;
  }
  try {
    await navigator.clipboard.writeText(text);
    showToast({ status: "success", message: "Copie reussie." });
  } catch {
    showToast({ status: "warning", message: "Copie impossible (permissions navigateur)." });
  }
}

function refreshVerification(): void {
  const target = currentRoot || getMountEl();
  if (target) void renderVerificationPageAsync(target);
}
