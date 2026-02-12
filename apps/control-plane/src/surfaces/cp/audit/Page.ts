import { coreBaseStyles } from "@modules/core-system/ui/frontend-ts/shared/coreStyles";
import { createPageShell } from "../../../core/ui/pageShell";
import { createSectionCard } from "../../../core/ui/sectionCard";
import { createToolbar } from "../../../core/ui/toolbar";
import { createBadge } from "../../../core/ui/badge";
import { createErrorState } from "../../../core/ui/errorState";
import { createContextualEmptyState } from "../../../core/ui/emptyState";
import { createDataTable, type TableColumn } from "../../../core/ui/dataTable";
import { showToast } from "../../../core/ui/toast";
import { getApiBase } from "/src/core/runtime/apiBase";
import { getSafeMode } from "@modules/core-system/ui/frontend-ts/pages/_shared/safeMode";
import { mapSafeMode } from "../_shared/cpLayout";
import { getSession } from "/src/localAuth";

type AuditRow = {
  id: number;
  tenant_id: string | null;
  user_id: string | null;
  action: string;
  resource_type: string;
  metadata: string | null;
  created_at: string;
};

type AuditData = {
  rows: AuditRow[];
  lastUpdated: string;
  total: number;
};

type AuditMode = "live" | "error";

type SavedAuditFilter = {
  id: string;
  name: string;
  state: {
    search: string;
    resource: string;
    action: string;
    role: string;
    tenantId: string;
    userId: string;
    start: string;
    end: string;
    limit: number;
  };
};

type AuditPreset = {
  id: string;
  name: string;
  description?: string | undefined;
  is_shared?: number | undefined;
  created_by?: string | undefined;
  usage_count?: number | undefined;
  query: SavedAuditFilter["state"];
};

function getAuthHeaders(): Record<string, string> {
  const s = getSession();
  const role = String((s as any)?.role || "USER").toUpperCase();
  const userId = String((s as any)?.username || (s as any)?.userId || "");
  const tenantId = String((globalThis as any).__ICONTROL_RUNTIME__?.tenantId || "default");
  return {
    "Content-Type": "application/json",
    "x-user-role": role,
    "x-user-id": userId,
    "x-tenant-id": tenantId,
  };
}

async function fetchAudit(params: {
  limit: number;
  offset: number;
  q?: string;
  tenantId?: string;
  userId?: string;
  role?: string;
  action?: string;
  resourceType?: string;
  start?: string;
  end?: string;
}): Promise<{ rows: AuditRow[]; total: number; error?: string }> {
  try {
    const API_BASE = getApiBase();
    const qs = new URLSearchParams();
    qs.set("limit", String(params.limit));
    qs.set("offset", String(params.offset));
    if (params.q) qs.set("q", params.q);
    if (params.tenantId) qs.set("tenant_id", params.tenantId);
    if (params.userId) qs.set("user_id", params.userId);
    if (params.role) qs.set("role", params.role);
    if (params.action) qs.set("action", params.action);
    if (params.resourceType) qs.set("resource_type", params.resourceType);
    if (params.start) qs.set("start", params.start);
    if (params.end) qs.set("end", params.end);
    const res = await fetch(`${API_BASE}/api/cp/audit?${qs.toString()}`);
    if (!res.ok) return { rows: [], error: `HTTP ${res.status}`, total: 0 };
    const json = (await res.json()) as { success: boolean; data: AuditRow[]; meta?: { total?: number; limit?: number; offset?: number } };
    return { rows: json.data || [], total: json.meta?.total ?? json.data?.length ?? 0 };
  } catch (e) {
    return { rows: [], error: String(e), total: 0 };
  }
}

export function renderAudit(root: HTMLElement): void {
  void renderAuditAsync(root);
}

async function downloadWithProgress(url: string, filename: string, statusEl?: HTMLElement) {
  try {
    if (statusEl) statusEl.textContent = "Export en cours...";
    const res = await fetch(url);
    if (!res.ok || !res.body) {
      if (statusEl) statusEl.textContent = "Erreur export";
      return;
    }
    const total = Number(res.headers.get("Content-Length") || "0");
    const reader = res.body.getReader();
    const chunks: BlobPart[] = [];
    let received = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        chunks.push(value as BlobPart);
        received += value.length;
        if (statusEl) {
          const kb = Math.round(received / 1024);
          const pct = total ? ` (${Math.round((received / total) * 100)}%)` : "";
          statusEl.textContent = `Export: ${kb} KB${pct}`;
        }
      }
    }
    const blob = new Blob(chunks, { type: res.headers.get("Content-Type") || "application/octet-stream" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    if (statusEl) statusEl.textContent = "Export terminé";
  } catch (err) {
    if (statusEl) statusEl.textContent = "Erreur export";
  }
}

function readAuditStateFromUrl() {
  try {
    const hash = window.location.hash || "#/audit";
    const query = hash.split("?")[1] || "";
    const params = new URLSearchParams(query);
    const num = (k: string, fallback: number) => {
      const raw = params.get(k);
      if (!raw) return fallback;
      const n = Number(raw);
      return Number.isFinite(n) ? n : fallback;
    };
    return {
      search: params.get("q") || "",
      resource: params.get("resource") || "",
      action: params.get("action") || "",
      role: params.get("role") || "",
      tenantId: params.get("tenant_id") || "",
      userId: params.get("user_id") || "",
      start: params.get("start") || "",
      end: params.get("end") || "",
      limit: num("limit", 100),
      offset: num("offset", 0),
    };
  } catch {
    return null;
  }
}

function writeAuditStateToUrl(state: {
  search: string;
  resource: string;
  action: string;
  role: string;
  tenantId: string;
  userId: string;
  start: string;
  end: string;
  limit: number;
  offset: number;
}) {
  try {
    const hash = window.location.hash || "#/audit";
    const [path, query] = hash.split("?");
    const params = new URLSearchParams(query || "");
    const setOrDelete = (k: string, v: string | number) => {
      const value = String(v || "");
      if (value) params.set(k, value);
      else params.delete(k);
    };
    setOrDelete("q", state.search);
    setOrDelete("resource", state.resource);
    setOrDelete("action", state.action);
    setOrDelete("role", state.role);
    setOrDelete("tenant_id", state.tenantId);
    setOrDelete("user_id", state.userId);
    setOrDelete("start", state.start);
    setOrDelete("end", state.end);
    setOrDelete("limit", state.limit);
    setOrDelete("offset", state.offset);
    const next = `${path}?${params.toString()}`;
    if (window.location.hash !== next) {
      window.history.replaceState(null, "", next);
    }
  } catch {}
}

async function renderAuditAsync(root: HTMLElement): Promise<void> {
  root.innerHTML = coreBaseStyles();
  const safeModeValue = mapSafeMode(getSafeMode());
  const { shell, content } = createPageShell({
    title: "Audit",
    subtitle: "Traçabilité des actions critiques",
    safeMode: safeModeValue,
    statusBadge: { label: "CHARGEMENT", tone: "info" },
  });

  const fromUrl = readAuditStateFromUrl();
  const state = {
    search: fromUrl?.search || "",
    resource: fromUrl?.resource || "",
    action: fromUrl?.action || "",
    role: fromUrl?.role || "",
    tenantId: fromUrl?.tenantId || "",
    userId: fromUrl?.userId || "",
    start: fromUrl?.start || "",
    end: fromUrl?.end || "",
    limit: fromUrl?.limit || 100,
    offset: fromUrl?.offset || 0,
  };

  const summaryCard = createSectionCard({
    title: "Résumé",
    description: "Synthèse rapide des actions enregistrées",
  });

  const listCard = createSectionCard({
    title: "Journal d'audit",
    description: "Actions de gouvernance et modifications critiques",
  });

  content.appendChild(summaryCard.card);
  content.appendChild(listCard.card);
  root.appendChild(shell);

  const renderData = (data: AuditData, errors?: string, mode: AuditMode = "live") => {
    summaryCard.body.innerHTML = "";
    listCard.body.innerHTML = "";

    let exportStatus: HTMLElement | undefined;
    const statusBadge = mode === "live" ? { label: "LIVE", tone: "ok" as const } : { label: "ERREUR", tone: "err" as const };
    const header = shell.querySelector("[data-ic-page-status]") as HTMLElement | null;
    if (header) header.textContent = statusBadge.label;

    if (errors) {
      summaryCard.body.appendChild(createErrorState({ code: "ERR_AUDIT_FETCH", message: errors }));
    }

    const total = data.total || data.rows.length;
    const byAction = new Map<string, number>();
    data.rows.forEach((row) => {
      byAction.set(row.action, (byAction.get(row.action) ?? 0) + 1);
    });

    const topActions = Array.from(byAction.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([k, v]) => `${k}: ${v}`);

    summaryCard.body.appendChild(createBadge(`Total: ${total}`, "info"));
    if (topActions.length) {
      const p = document.createElement("p");
      p.style.cssText = "margin:10px 0 0 0; opacity:0.7;";
      p.textContent = `Top actions: ${topActions.join(", ")}`;
      summaryCard.body.appendChild(p);
    }

    const { element: toolbar, searchInput } = createToolbar({
      searchPlaceholder: "Recherche (action, user, tenant, resource...)",
      onSearch: (value) => {
        state.search = value.toLowerCase().trim();
        state.offset = 0;
        writeAuditStateToUrl(state);
        refresh();
      },
      filters: [
        {
          label: "Action",
          options: [{ label: "Toutes", value: "" }, ...uniqueValues(data.rows.map((r) => r.action)).map((v) => ({ label: v, value: v }))],
          value: state.action,
          onChange: (value) => {
            state.action = value;
            state.offset = 0;
            writeAuditStateToUrl(state);
            refresh();
          },
        },
        {
          label: "Resource",
          options: [{ label: "Toutes", value: "" }, ...uniqueValues(data.rows.map((r) => r.resource_type)).map((v) => ({ label: v, value: v }))],
          value: state.resource,
          onChange: (value) => {
            state.resource = value;
            state.offset = 0;
            writeAuditStateToUrl(state);
            refresh();
          },
        },
        {
          label: "Role",
          options: [{ label: "Toutes", value: "" }, ...uniqueValues(data.rows.map((r) => extractRole(r.metadata))).map((v) => ({ label: v, value: v }))],
          value: state.role,
          onChange: (value) => {
            state.role = value;
            state.offset = 0;
            writeAuditStateToUrl(state);
            refresh();
          },
        },
        {
          label: "Limit",
          options: [
            { label: "50", value: "50" },
            { label: "100", value: "100" },
            { label: "200", value: "200" },
          ],
          value: String(state.limit),
          onChange: (value) => {
            state.limit = Number(value);
            state.offset = 0;
            writeAuditStateToUrl(state);
            refresh();
          },
        },
      ],
      actions: [
        { label: "Rafraîchir", primary: true, onClick: () => refresh() },
        { label: "Reset filtres", onClick: () => {
          state.search = "";
          state.resource = "";
          state.action = "";
          state.role = "";
          state.tenantId = "";
          state.userId = "";
          state.start = "";
          state.end = "";
          state.offset = 0;
          if (searchInput) searchInput.value = "";
          writeAuditStateToUrl(state);
          refresh();
        }},
        { label: "Exporter CSV", actionId: "export_csv", onClick: () => exportServerCsv(state, exportStatus) },
        { label: "Exporter JSON", actionId: "export_json", onClick: () => exportServerJson(state, exportStatus) },
      ],
    });
    if (searchInput) searchInput.value = state.search;

    exportStatus = document.createElement("div");
    exportStatus.className = "ic-admin-export-status";
    exportStatus.textContent = "";

    listCard.body.appendChild(toolbar);
    listCard.body.appendChild(exportStatus);
    listCard.body.appendChild(buildAuditPresets(state, () => {
      writeAuditStateToUrl(state);
      refresh();
    }));
    listCard.body.appendChild(buildSavedFiltersUI(state, () => refresh(), () => writeAuditStateToUrl(state)));
    listCard.body.appendChild(buildExtraFilters(state, () => {
      state.offset = 0;
      writeAuditStateToUrl(state);
      refresh();
    }));

    const tableContainer = document.createElement("div");
    listCard.body.appendChild(tableContainer);

    const columns: TableColumn<AuditRow>[] = [
      { key: "created_at", label: "Horodatage", sortable: true, render: (v) => new Date(String(v)).toLocaleString("fr-CA") },
      { key: "action", label: "Action", sortable: true, render: (v) => createBadge(String(v), "info") },
      { key: "resource_type", label: "Resource", sortable: true, render: (v) => createBadge(String(v), "neutral") },
      { key: "tenant_id", label: "Tenant", sortable: true, render: (v) => String(v ?? "—") },
      { key: "user_id", label: "User", sortable: true, render: (v) => String(v ?? "—") },
      {
        key: "metadata",
        label: "Metadata",
        render: (v, row) => {
          const div = document.createElement("div");
          div.style.cssText = "font-size:11px; opacity:0.7; display:grid; gap:4px;";
          const metaText = document.createElement("div");
          metaText.textContent = String(v ?? "");
          div.appendChild(metaText);
          const tags = document.createElement("div");
          tags.className = "ic-admin-tag-row";
          const roleTag = extractRole(row.metadata);
          if (roleTag) tags.appendChild(createBadge(`role:${roleTag}`, "neutral"));
          if (row.action) tags.appendChild(createBadge(`action:${row.action}`, "info"));
          if (row.resource_type) tags.appendChild(createBadge(`res:${row.resource_type}`, "neutral"));
          div.appendChild(tags);
          return div;
        },
      },
    ];

    tableContainer.innerHTML = "";
    if (!data.rows.length) {
      tableContainer.appendChild(
        createContextualEmptyState("logs", {
          message: "Aucune entrée ne correspond aux filtres.",
        })
      );
    } else {
      tableContainer.appendChild(createDataTable({ columns, data: data.rows, pagination: true, pageSize: 20 }));
    }

    listCard.body.appendChild(buildPager(state, data.total, () => {
      writeAuditStateToUrl(state);
      refresh();
    }));
  };

  const refresh = async () => {
    const res = await fetchAudit({
      limit: state.limit,
      offset: state.offset,
      ...(state.search ? { q: state.search } : {}),
      tenantId: state.tenantId,
      userId: state.userId,
      role: state.role,
      action: state.action,
      resourceType: state.resource,
      start: state.start,
      end: state.end,
    });
    if (res.error) {
      renderData({ rows: [], lastUpdated: new Date().toISOString(), total: 0 }, res.error, "error");
      showToast({ status: "warning", message: "Audit indisponible (fallback erreur)." });
      return;
    }
    renderData({ rows: res.rows, lastUpdated: new Date().toISOString(), total: res.total }, undefined, "live");
  };

  await refresh();

  window.addEventListener("hashchange", () => {
    const next = readAuditStateFromUrl();
    if (!next) return;
    const changed =
      next.search !== state.search ||
      next.resource !== state.resource ||
      next.action !== state.action ||
      next.role !== state.role ||
      next.tenantId !== state.tenantId ||
      next.userId !== state.userId ||
      next.start !== state.start ||
      next.end !== state.end ||
      next.limit !== state.limit ||
      next.offset !== state.offset;
    if (!changed) return;
    state.search = next.search;
    state.resource = next.resource;
    state.action = next.action;
    state.role = next.role;
    state.tenantId = next.tenantId;
    state.userId = next.userId;
    state.start = next.start;
    state.end = next.end;
    state.limit = next.limit;
    state.offset = next.offset;
    refresh();
  });
}

function uniqueValues(values: string[]): string[] {
  return Array.from(new Set(values.filter(Boolean))).sort((a, b) => a.localeCompare(b));
}

function extractRole(metadata: string | null): string {
  if (!metadata) return "";
  try {
    const obj = JSON.parse(metadata);
    return String(obj.role || "");
  } catch {
    return "";
  }
}

function buildExtraFilters(
  state: { tenantId: string; userId: string; start: string; end: string },
  onChange: () => void
): HTMLElement {
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap:8px; margin:8px 0 0;";

  const mkInput = (label: string, value: string, onInput: (v: string) => void, type = "text") => {
    const box = document.createElement("label");
    box.style.cssText = "display:grid; gap:4px; font-size:12px; opacity:0.8;";
    const span = document.createElement("span");
    span.textContent = label;
    const input = document.createElement("input");
    input.type = type;
    input.value = value;
    input.className = "ic-admin-input";
    input.oninput = (e) => {
      onInput((e.target as HTMLInputElement).value);
      onChange();
    };
    box.appendChild(span);
    box.appendChild(input);
    return box;
  };

  wrap.appendChild(mkInput("Tenant ID", state.tenantId, (v) => (state.tenantId = v)));
  wrap.appendChild(mkInput("User ID", state.userId, (v) => (state.userId = v)));
  wrap.appendChild(mkInput("Date début", state.start, (v) => (state.start = v), "date"));
  wrap.appendChild(mkInput("Date fin", state.end, (v) => (state.end = v), "date"));

  return wrap;
}

function buildAuditPresets(
  state: { resource: string; action: string; role: string; tenantId: string; userId: string; start: string; end: string; limit: number; offset: number },
  onApply: () => void
): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "ic-admin-filter-chips";
  const mk = (label: string, apply: () => void) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ic-admin-chip-btn";
    btn.textContent = label;
    btn.onclick = () => {
      apply();
      state.offset = 0;
      onApply();
    };
    return btn;
  };
  const today = new Date();
  const isoDate = (d: Date) => d.toISOString().slice(0, 10);

  wrap.appendChild(mk("Dernières 24h", () => {
    const d = new Date();
    d.setDate(today.getDate() - 1);
    state.start = isoDate(d);
    state.end = isoDate(today);
  }));
  wrap.appendChild(mk("7 derniers jours", () => {
    const d = new Date();
    d.setDate(today.getDate() - 7);
    state.start = isoDate(d);
    state.end = isoDate(today);
  }));
  wrap.appendChild(mk("Pages Studio", () => {
    state.resource = "cp_pages";
  }));
  wrap.appendChild(mk("Security", () => {
    state.resource = "security";
  }));
  wrap.appendChild(mk("Providers", () => {
    state.resource = "providers";
  }));
  return wrap;
}

async function fetchAuditPresets(params: { scope?: string; order?: string } = {}): Promise<AuditPreset[]> {
  try {
    const qs = new URLSearchParams();
    if (params.scope) qs.set("scope", params.scope);
    if (params.order) qs.set("order", params.order);
    const res = await fetch(`${getApiBase()}/api/cp/audit-presets?${qs.toString()}`, { headers: getAuthHeaders() });
    if (!res.ok) return [];
    const json = (await res.json()) as { success: boolean; data?: Array<{ id: string; name: string; description?: string; is_shared?: number; created_by?: string; usage_count?: number; query_json: string }> };
    if (!json.success || !json.data) return [];
    return json.data.map((row) => {
      let query: SavedAuditFilter["state"] = { search: "", resource: "", action: "", role: "", tenantId: "", userId: "", start: "", end: "", limit: 100 };
      try {
        const parsed = JSON.parse(row.query_json || "{}");
        query = { ...query, ...(parsed || {}) };
      } catch {}
      return { id: row.id, name: row.name, description: row.description, is_shared: row.is_shared, created_by: row.created_by, usage_count: row.usage_count, query };
    });
  } catch {
    return [];
  }
}

async function saveAuditPreset(name: string, description: string, isShared: boolean, query: SavedAuditFilter["state"], id?: string): Promise<void> {
  await fetch(`${getApiBase()}/api/cp/audit-presets`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ id, name, description, is_shared: isShared, query }),
  });
}

async function deleteAuditPreset(id: string): Promise<void> {
  await fetch(`${getApiBase()}/api/cp/audit-presets/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: getAuthHeaders(),
  });
}

async function useAuditPreset(id: string): Promise<void> {
  await fetch(`${getApiBase()}/api/cp/audit-presets/${encodeURIComponent(id)}/use`, {
    method: "POST",
    headers: getAuthHeaders(),
  });
}

function buildSavedFiltersUI(
  state: { search: string; resource: string; action: string; role: string; tenantId: string; userId: string; start: string; end: string; limit: number; offset: number },
  onApply: () => void,
  onSyncUrl: () => void
): HTMLElement {
  const wrap = document.createElement("div");
  wrap.className = "ic-admin-filter-actions";

  const s = getSession();
  const currentUser = String((s as any)?.username || (s as any)?.userId || "");
  const role = String((s as any)?.role || "USER").toUpperCase();
  const canAdmin = role === "SYSADMIN" || role === "ADMIN";

  const nameInput = document.createElement("input");
  nameInput.className = "ic-admin-input";
  nameInput.placeholder = "Nom du preset";

  const descInput = document.createElement("input");
  descInput.className = "ic-admin-input";
  descInput.placeholder = "Description (optionnel)";

  const sharedLabel = document.createElement("label");
  sharedLabel.className = "ic-admin-toggle";
  const sharedToggle = document.createElement("input");
  sharedToggle.type = "checkbox";
  sharedLabel.appendChild(sharedToggle);
  const sharedText = document.createElement("span");
  sharedText.textContent = "Partager (équipe)";
  sharedLabel.appendChild(sharedText);

  const sortSelect = document.createElement("select");
  sortSelect.className = "ic-admin-input";
  sortSelect.innerHTML = `
    <option value="updated">Tri: récent</option>
    <option value="usage">Tri: usage</option>
  `;

  const scopeSelect = document.createElement("select");
  scopeSelect.className = "ic-admin-input";
  scopeSelect.innerHTML = `
    <option value="all">Scope: tous</option>
    <option value="shared">Scope: partagés</option>
    <option value="private">Scope: privés</option>
  `;

  const saveBtn = document.createElement("button");
  saveBtn.className = "ic-admin-btn";
  saveBtn.textContent = "Enregistrer preset";
  const clearBtn = document.createElement("button");
  clearBtn.className = "ic-admin-btn";
  clearBtn.textContent = "Reset sélection";

  const chips = document.createElement("div");
  chips.className = "ic-admin-filter-chips";

  let selectedPresetId: string | null = null;

  const renderChips = async () => {
    chips.innerHTML = "";
    const saved = await fetchAuditPresets({ scope: scopeSelect.value, order: sortSelect.value });
    if (!saved.length) return;
    saved.forEach((preset) => {
      const btn = document.createElement("button");
      btn.className = "ic-admin-chip-btn";
      const count = typeof preset.usage_count === "number" ? preset.usage_count : 0;
      btn.textContent = `${preset.name}${count ? ` (${count})` : ""}`;
      if (preset.description) btn.title = preset.description;
      btn.onclick = () => {
        selectedPresetId = preset.id;
        state.search = preset.query.search || "";
        state.resource = preset.query.resource || "";
        state.action = preset.query.action || "";
        state.role = preset.query.role || "";
        state.tenantId = preset.query.tenantId || "";
        state.userId = preset.query.userId || "";
        state.start = preset.query.start || "";
        state.end = preset.query.end || "";
        state.limit = preset.query.limit || state.limit;
        state.offset = 0;
        nameInput.value = preset.name || "";
        descInput.value = preset.description || "";
        sharedToggle.checked = !!preset.is_shared;
        onSyncUrl();
        onApply();
        void useAuditPreset(preset.id).then(() => renderChips());
      };

      const remove = document.createElement("button");
      remove.className = "ic-admin-chip-remove";
      remove.textContent = "×";
      remove.onclick = (e) => {
        e.stopPropagation();
        const canDelete = canAdmin || (preset.created_by && preset.created_by === currentUser);
        if (!canDelete) return;
        void deleteAuditPreset(preset.id).then(() => renderChips());
      };
      if (!canAdmin && preset.created_by && preset.created_by !== currentUser) {
        remove.disabled = true;
        remove.title = "Supprimer: réservé au propriétaire";
      }
      btn.appendChild(remove);
      chips.appendChild(btn);
    });
  };

  saveBtn.onclick = () => {
    const name = nameInput.value.trim();
    if (!name) return;
    const isUpdate = !!selectedPresetId;
    void saveAuditPreset(name, descInput.value.trim(), sharedToggle.checked, {
      search: state.search,
      resource: state.resource,
      action: state.action,
      role: state.role,
      tenantId: state.tenantId,
      userId: state.userId,
      start: state.start,
      end: state.end,
      limit: state.limit,
    }, isUpdate ? selectedPresetId! : undefined).then(() => {
      nameInput.value = "";
      descInput.value = "";
      sharedToggle.checked = false;
      selectedPresetId = null;
      renderChips();
    });
  };

  clearBtn.onclick = () => {
    nameInput.value = "";
    descInput.value = "";
    sharedToggle.checked = false;
    selectedPresetId = null;
  };

  sortSelect.onchange = () => void renderChips();
  scopeSelect.onchange = () => void renderChips();

  wrap.appendChild(nameInput);
  wrap.appendChild(descInput);
  wrap.appendChild(sharedLabel);
  wrap.appendChild(sortSelect);
  wrap.appendChild(scopeSelect);
  wrap.appendChild(saveBtn);
  wrap.appendChild(clearBtn);
  wrap.appendChild(chips);
  void renderChips();
  return wrap;
}

function exportServerCsv(
  state: { search: string; tenantId: string; userId: string; role: string; action: string; resource: string; start: string; end: string },
  statusEl?: HTMLElement
) {
  const API_BASE = getApiBase();
  const qs = new URLSearchParams();
  if (state.search) qs.set("q", state.search);
  if (state.tenantId) qs.set("tenant_id", state.tenantId);
  if (state.userId) qs.set("user_id", state.userId);
  if (state.role) qs.set("role", state.role);
  if (state.action) qs.set("action", state.action);
  if (state.resource) qs.set("resource_type", state.resource);
  if (state.start) qs.set("start", state.start);
  if (state.end) qs.set("end", state.end);
  qs.set("stream", "1");
  const url = `${API_BASE}/api/cp/audit.csv?${qs.toString()}`;
  void downloadWithProgress(url, "audit.csv", statusEl);
}

function exportServerJson(
  state: { search: string; tenantId: string; userId: string; role: string; action: string; resource: string; start: string; end: string },
  statusEl?: HTMLElement
) {
  const API_BASE = getApiBase();
  const qs = new URLSearchParams();
  if (state.search) qs.set("q", state.search);
  if (state.tenantId) qs.set("tenant_id", state.tenantId);
  if (state.userId) qs.set("user_id", state.userId);
  if (state.role) qs.set("role", state.role);
  if (state.action) qs.set("action", state.action);
  if (state.resource) qs.set("resource_type", state.resource);
  if (state.start) qs.set("start", state.start);
  if (state.end) qs.set("end", state.end);
  qs.set("stream", "1");
  const url = `${API_BASE}/api/cp/audit.json?${qs.toString()}`;
  void downloadWithProgress(url, "audit.json", statusEl);
}

function buildPager(
  state: { limit: number; offset: number },
  total: number,
  onChange: () => void
): HTMLElement {
  const wrap = document.createElement("div");
  wrap.style.cssText = "display:flex; gap:10px; align-items:center; margin-top:10px; flex-wrap:wrap;";

  const page = Math.floor(state.offset / state.limit) + 1;
  const totalPages = Math.max(1, Math.ceil(total / state.limit));

  const btnFirst = document.createElement("button");
  btnFirst.className = "ic-admin-btn";
  btnFirst.textContent = "Début";
  btnFirst.disabled = page <= 1;
  btnFirst.onclick = () => {
    state.offset = 0;
    onChange();
  };

  const btnPrev = document.createElement("button");
  btnPrev.className = "ic-admin-btn";
  btnPrev.textContent = "Précédent";
  btnPrev.disabled = page <= 1;
  btnPrev.onclick = () => {
    state.offset = Math.max(0, state.offset - state.limit);
    onChange();
  };

  const btnNext = document.createElement("button");
  btnNext.className = "ic-admin-btn";
  btnNext.textContent = "Suivant";
  btnNext.disabled = page >= totalPages;
  btnNext.onclick = () => {
    state.offset = state.offset + state.limit;
    onChange();
  };

  const btnLast = document.createElement("button");
  btnLast.className = "ic-admin-btn";
  btnLast.textContent = "Fin";
  btnLast.disabled = page >= totalPages;
  btnLast.onclick = () => {
    state.offset = Math.max(0, (totalPages - 1) * state.limit);
    onChange();
  };

  const label = document.createElement("span");
  label.style.cssText = "font-size:12px; opacity:0.7;";
  label.textContent = `Page ${page} / ${totalPages}`;

  const pageInput = document.createElement("input");
  pageInput.className = "ic-admin-input";
  pageInput.type = "number";
  pageInput.min = "1";
  pageInput.max = String(totalPages);
  pageInput.value = String(page);
  pageInput.style.width = "90px";
  const goBtn = document.createElement("button");
  goBtn.className = "ic-admin-btn";
  goBtn.textContent = "Aller";
  goBtn.onclick = () => {
    const target = Math.min(totalPages, Math.max(1, Number(pageInput.value || "1")));
    state.offset = (target - 1) * state.limit;
    onChange();
  };

  const limitSelect = document.createElement("select");
  limitSelect.className = "ic-admin-input";
  [50, 100, 200].forEach((n) => {
    const opt = document.createElement("option");
    opt.value = String(n);
    opt.textContent = `Page size ${n}`;
    if (state.limit === n) opt.selected = true;
    limitSelect.appendChild(opt);
  });
  limitSelect.onchange = () => {
    state.limit = Number(limitSelect.value);
    state.offset = 0;
    onChange();
  };

  wrap.appendChild(btnFirst);
  wrap.appendChild(btnPrev);
  wrap.appendChild(btnNext);
  wrap.appendChild(btnLast);
  wrap.appendChild(label);
  wrap.appendChild(pageInput);
  wrap.appendChild(goBtn);
  wrap.appendChild(limitSelect);
  return wrap;
}
