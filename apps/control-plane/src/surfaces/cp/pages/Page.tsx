/**
 * ICONTROL_CP_PAGES_INVENTORY_V3
 * Pages Inventory — Complete listing of all CP pages (active/inactive) from ROUTE_CATALOG and registry
 */
import { coreBaseStyles } from "@modules/core-system/ui/frontend-ts/shared/coreStyles";
import { createPageShell } from "../../../core/ui/pageShell";
import { createSectionCard } from "../../../core/ui/sectionCard";
import { createToolbar } from "../../../core/ui/toolbar";
import { createBadge } from "../../../core/ui/badge";
import { createDataTable, type TableColumn } from "../../../core/ui/dataTable";
import { createKpiStrip } from "../../../core/ui/kpi";
import { createGovernanceFooter, mapSafeMode } from "../_shared/cpLayout";
import { getSafeMode } from "@modules/core-system/ui/frontend-ts/pages/_shared/safeMode";
import { getPagesInventory, type PageInventoryEntry } from "/src/core/pagesInventory";
import { getApiBase } from "/src/core/runtime/apiBase";
import { getSession } from "/src/localAuth";
import { getPermissionClaims, hasPermission } from "/src/runtime/rbac";
import { syncCatalog, publishPage, revertPage, activatePage, deactivatePage } from "@/platform/commands/pagesCommands";
import { LocalStorageProvider } from "/src/core/control-plane/storage";

const CP_PAGES = getPagesInventory("CP");
const CLIENT_PAGES = getPagesInventory("CLIENT");

type DiffLine = {
  text: string;
  status: "same" | "changed" | "missing";
  keyHit?: boolean;
};

type CpPageRecord = {
  id: string;
  route_id: string;
  title: string;
  path: string | null;
  status: string;
  module_id: string | null;
  permissions_json: string | null;
  feature_flag_id: string | null;
  state: string | null;
  version: number | null;
  published_at: string | null;
  activated_at: string | null;
  is_active: number | null;
  draft_json: string | null;
  published_json: string | null;
  created_at: string;
  updated_at: string;
};

function formatJson(value?: string | null): string {
  if (!value) return "";
  try {
    const parsed = JSON.parse(value);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return String(value);
  }
}

function computeKeyDiff(leftRaw: string | null | undefined, rightRaw: string | null | undefined) {
  const left: Record<string, unknown> = (() => {
    try { return leftRaw ? JSON.parse(leftRaw) : {}; } catch { return {}; }
  })();
  const right: Record<string, unknown> = (() => {
    try { return rightRaw ? JSON.parse(rightRaw) : {}; } catch { return {}; }
  })();
  const leftKeys = new Set(Object.keys(left || {}));
  const rightKeys = new Set(Object.keys(right || {}));
  const added: string[] = [];
  const removed: string[] = [];
  const changed: string[] = [];
  leftKeys.forEach((k) => {
    if (!rightKeys.has(k)) removed.push(k);
    else if (JSON.stringify((left as any)[k]) !== JSON.stringify((right as any)[k])) changed.push(k);
  });
  rightKeys.forEach((k) => {
    if (!leftKeys.has(k)) added.push(k);
  });
  return { added, removed, changed };
}

function diffLines(left: string, right: string, highlightKeys: Set<string>): { left: DiffLine[]; right: DiffLine[] } {
  const leftLines = left.split("\n");
  const rightLines = right.split("\n");
  const max = Math.max(leftLines.length, rightLines.length);
  const outLeft: DiffLine[] = [];
  const outRight: DiffLine[] = [];
  for (let i = 0; i < max; i += 1) {
    const l = leftLines[i] ?? "";
    const r = rightLines[i] ?? "";
    const keyHit = Array.from(highlightKeys).some((k) => l.includes(`"${k}"`) || r.includes(`"${k}"`));
    if (l === r) {
      outLeft.push({ text: l, status: "same", keyHit });
      outRight.push({ text: r, status: "same", keyHit });
      continue;
    }
    if (!l) {
      outLeft.push({ text: "", status: "missing", keyHit });
      outRight.push({ text: r, status: "changed", keyHit });
      continue;
    }
    if (!r) {
      outLeft.push({ text: l, status: "changed", keyHit });
      outRight.push({ text: "", status: "missing", keyHit });
      continue;
    }
    outLeft.push({ text: l, status: "changed", keyHit });
    outRight.push({ text: r, status: "changed", keyHit });
  }
  return { left: outLeft, right: outRight };
}

function getAuthHeaders(): Record<string, string> {
  const s = getSession();
  const role = String((s as any)?.role || "USER").toUpperCase();
  const userId = String((s as any)?.username || (s as any)?.userId || "");
  const tenantId = String((globalThis as any).__ICONTROL_RUNTIME__?.tenantId || "default");
  const perms = getPermissionClaims();
  return {
    "Content-Type": "application/json",
    "x-user-role": role,
    "x-user-id": userId,
    "x-tenant-id": tenantId,
    "x-user-permissions": perms.join(","),
  };
}

export function renderPages(root: HTMLElement): void {
  const safeModeValue = mapSafeMode(getSafeMode());
  root.innerHTML = coreBaseStyles();
  const { shell, content } = createPageShell({
    title: "Registre des pages",
    subtitle: "Routes et périmètre",
    safeMode: safeModeValue,
    statusBadge: { label: "GOUVERNÉ", tone: "info" }
  });

  const storage = new LocalStorageProvider("");
  const SURFACE_KEY = "icontrol_pages_surface";
  const readSurfaceFromUrl = () => {
    try {
      const hash = window.location.hash || "#/pages";
      const query = hash.split("?")[1] || "";
      const params = new URLSearchParams(query);
      const raw = (params.get("surface") || "").toLowerCase();
      if (raw === "client") return "CLIENT";
      if (raw === "cp") return "CP";
    } catch {}
    return null;
  };
  const readFilterFromUrl = (key: string) => {
    try {
      const hash = window.location.hash || "#/pages";
      const query = hash.split("?")[1] || "";
      const params = new URLSearchParams(query);
      return params.get(key) || "";
    } catch {
      return "";
    }
  };
  const readSurfaceFromStorage = () => {
    try {
      const raw = storage.getItem(SURFACE_KEY);
      if (raw === "CLIENT" || raw === "CP") return raw as "CLIENT" | "CP";
    } catch {}
    return null;
  };
  const writeSurfaceToStorage = (s: "CP" | "CLIENT") => {
    try { storage.setItem(SURFACE_KEY, s); } catch {}
  };
  const writeSurfaceToUrl = (s: "CP" | "CLIENT") => {
    try {
      const hash = window.location.hash || "#/pages";
      const [path, query] = hash.split("?");
      const params = new URLSearchParams(query || "");
      params.set("surface", s === "CP" ? "cp" : "client");
      const next = `${path}?${params.toString()}`;
      if (window.location.hash !== next) {
        window.history.replaceState(null, "", next);
      }
    } catch {}
  };
  const writeFilterToUrl = (next: { q?: string; status?: string; registry?: string }) => {
    try {
      const hash = window.location.hash || "#/pages";
      const [path, query] = hash.split("?");
      const params = new URLSearchParams(query || "");
      if (typeof next.q === "string") {
        if (next.q) params.set("q", next.q);
        else params.delete("q");
      }
      if (typeof next.status === "string") {
        if (next.status) params.set("status", next.status);
        else params.delete("status");
      }
      if (typeof next.registry === "string") {
        if (next.registry) params.set("registry", next.registry);
        else params.delete("registry");
      }
      const nextHash = `${path}?${params.toString()}`;
      if (window.location.hash !== nextHash) {
        window.history.replaceState(null, "", nextHash);
      }
    } catch {}
  };

  let currentSurface: "CP" | "CLIENT" =
    readSurfaceFromUrl() ||
    readSurfaceFromStorage() ||
    "CP";

  const getSurfacePages = () => (currentSurface === "CP" ? CP_PAGES : CLIENT_PAGES);
  const getSurfaceLabel = () => (currentSurface === "CP" ? "CP" : "Client");

  const computeKpis = (pages: PageInventoryEntry[]) => ({
    total: pages.length,
    active: pages.filter((p) => p.status === "ACTIVE").length,
    experimental: pages.filter((p) => p.status === "EXPERIMENTAL").length,
    inRegistry: pages.filter((p) => p.inRegistry).length,
  });

  const initialKpis = computeKpis(currentSurface === "CP" ? CP_PAGES : CLIENT_PAGES);
  
  const kpis = createKpiStrip([
    { label: "Total Pages", value: String(initialKpis.total), tone: "info" },
    { label: "Active", value: String(initialKpis.active), tone: "ok" },
    { label: "Experimental", value: String(initialKpis.experimental), tone: "warn" },
    { label: "In Registry", value: String(initialKpis.inRegistry), tone: initialKpis.inRegistry === initialKpis.total ? "ok" : "warn" }
  ]);
  content.appendChild(kpis);

  const studioSection = createSectionCard({
    title: "Page Studio — CP",
    description: "Créer, modifier et supprimer les pages métier CP (persistées en DB).",
  });
  const studioBody = studioSection.body;
  const studioStatus = document.createElement("div");
  studioStatus.className = "color-text-secondary";
  studioStatus.textContent = "Chargement des pages…";
  studioBody.appendChild(studioStatus);
  const studioActions = document.createElement("div");
  studioActions.className = "ic-admin-actions";
  const syncBtn = document.createElement("button");
  syncBtn.className = "ic-admin-btn";
  syncBtn.textContent = "Sync ROUTE_CATALOG";
  studioActions.appendChild(syncBtn);
  studioBody.appendChild(studioActions);

  const form = document.createElement("form");
  form.className = "ic-form";
  form.innerHTML = `
    <div class="ic-form__grid">
      <label class="ic-form__field">Route ID
        <input name="route_id" class="ic-input" placeholder="dashboard_cp" required />
      </label>
      <label class="ic-form__field">Title
        <input name="title" class="ic-input" placeholder="Dashboard" required />
      </label>
      <label class="ic-form__field">Path
        <input name="path" class="ic-input" placeholder="#/dashboard" />
      </label>
      <label class="ic-form__field">Status
        <select name="status" class="ic-input">
          <option value="ACTIVE">ACTIVE</option>
          <option value="EXPERIMENTAL">EXPERIMENTAL</option>
          <option value="HIDDEN">HIDDEN</option>
        </select>
      </label>
      <label class="ic-form__field">Module ID
        <input name="module_id" class="ic-input" placeholder="cp.dashboard" />
      </label>
      <label class="ic-form__field">Feature Flag
        <input name="feature_flag_id" class="ic-input" placeholder="flag.dashboard" />
      </label>
      <label class="ic-form__field">Permissions (CSV)
        <input name="permissions" class="ic-input" placeholder="cp:read,cp:write" />
      </label>
    </div>
    <div class="ic-form__actions">
      <button type="submit" class="btn-primary">Créer</button>
      <button type="button" class="ic-admin-btn" data-action="reset">Reset</button>
    </div>
  `;
  studioBody.appendChild(form);

  const tableHost = document.createElement("div");
  studioBody.appendChild(tableHost);

  let currentRows: CpPageRecord[] = [];
  let editingId: string | null = null;
  let editingVersion: number | null = null;
  const canCreate = hasPermission("cp.pages.create");
  const canUpdate = hasPermission("cp.pages.update");
  const canDelete = hasPermission("cp.pages.delete");
  const canPublish = hasPermission("cp.pages.publish");
  const canActivate = hasPermission("cp.pages.activate");
  const canSync = hasPermission("cp.pages.sync");

  const loadRows = async () => {
    try {
      const res = await fetch(`${getApiBase()}/api/cp/pages`, { headers: getAuthHeaders() });
      const json = (await res.json()) as { success: boolean; data?: CpPageRecord[]; error?: string };
      if (!res.ok || !json.success) {
        studioStatus.textContent = json.error || "Erreur de chargement.";
        return;
      }
      currentRows = json.data || [];
      const total = currentRows.length;
      const drafts = currentRows.filter((r) => (r.state ?? "DRAFT") === "DRAFT").length;
      const published = currentRows.filter((r) => r.state === "PUBLISHED").length;
      const active = currentRows.filter((r) => Number(r.is_active)).length;
      studioStatus.textContent = `Total: ${total} | Draft: ${drafts} | Published: ${published} | Active: ${active}`;
      renderStudioTable();
    } catch (err) {
      studioStatus.textContent = String(err);
    }
  };

  const resetForm = () => {
    editingId = null;
    editingVersion = null;
    (form.querySelector("[name=route_id]") as HTMLInputElement).value = "";
    (form.querySelector("[name=title]") as HTMLInputElement).value = "";
    (form.querySelector("[name=path]") as HTMLInputElement).value = "";
    (form.querySelector("[name=status]") as HTMLSelectElement).value = "ACTIVE";
    (form.querySelector("[name=module_id]") as HTMLInputElement).value = "";
    (form.querySelector("[name=feature_flag_id]") as HTMLInputElement).value = "";
    (form.querySelector("[name=permissions]") as HTMLInputElement).value = "";
    (form.querySelector("button[type=submit]") as HTMLButtonElement).textContent = "Créer";
  };

  const toPermissions = (raw: string) =>
    raw
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

  const upsert = async (payload: Record<string, unknown>) => {
    if (!canCreate && !editingId) {
      studioStatus.textContent = "Droits insuffisants (create).";
      return;
    }
    if (!canUpdate && editingId) {
      studioStatus.textContent = "Droits insuffisants (update).";
      return;
    }
    const url = editingId
      ? `${getApiBase()}/api/cp/pages/${encodeURIComponent(editingId)}`
      : `${getApiBase()}/api/cp/pages`;
    const method = editingId ? "PUT" : "POST";
    const res = await fetch(url, { method, headers: getAuthHeaders(), body: JSON.stringify(payload) });
    const json = (await res.json()) as { success: boolean; error?: string };
    if (!res.ok || !json.success) {
      if (json.error === "ERR_VERSION_CONFLICT") {
        studioStatus.textContent = "Conflit de version: actualiser avant de modifier.";
      } else {
        studioStatus.textContent = json.error || "Erreur sauvegarde.";
      }
      return;
    }
    resetForm();
    await loadRows();
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const route_id = (form.querySelector("[name=route_id]") as HTMLInputElement).value.trim();
    const title = (form.querySelector("[name=title]") as HTMLInputElement).value.trim();
    const path = (form.querySelector("[name=path]") as HTMLInputElement).value.trim();
    const status = (form.querySelector("[name=status]") as HTMLSelectElement).value;
    const module_id = (form.querySelector("[name=module_id]") as HTMLInputElement).value.trim();
    const feature_flag_id = (form.querySelector("[name=feature_flag_id]") as HTMLInputElement).value.trim();
    const permissions = (form.querySelector("[name=permissions]") as HTMLInputElement).value;
    if (!route_id || !title) {
      studioStatus.textContent = "Route ID et Title sont requis.";
      return;
    }
    upsert({
      route_id,
      title,
      path: path || null,
      status,
      module_id: module_id || null,
      feature_flag_id: feature_flag_id || null,
      permissions_required: toPermissions(permissions),
      ...(editingId && editingVersion !== null ? { expected_version: editingVersion } : {}),
    });
  });

  const resetBtn = form.querySelector("[data-action=reset]") as HTMLButtonElement | null;
  if (resetBtn) resetBtn.onclick = () => resetForm();
  if (!canCreate) {
    (form.querySelector("button[type=submit]") as HTMLButtonElement).disabled = true;
  }
  if (!canUpdate) {
    (form.querySelector("button[type=submit]") as HTMLButtonElement).title = "Droits insuffisants";
  }

  syncBtn.onclick = async () => {
    if (!canSync) {
      studioStatus.textContent = "Droits insuffisants (sync).";
      return;
    }
    const result = await syncCatalog();
    studioStatus.textContent = result.ok ? "Sync ROUTE_CATALOG effectuée." : (result.error || "Erreur sync.");
    if (result.ok) await loadRows();
  };

  const renderStudioTable = () => {
    tableHost.innerHTML = "";
    const hasDiff = (row: CpPageRecord) => {
      if (!row.published_json) return false;
      if (!row.draft_json) return false;
      return row.draft_json !== row.published_json;
    };
    const cols: TableColumn<CpPageRecord>[] = [
      { key: "route_id", label: "RouteId", sortable: true },
      { key: "title", label: "Title", sortable: true },
      { key: "path", label: "Path", sortable: true },
      { key: "state", label: "State", sortable: true, render: (v) => {
        const state = String(v ?? "DRAFT");
        const tone = state === "PUBLISHED" ? "ok" : state === "DRAFT" ? "warn" : "neutral";
        return createBadge(state, tone);
      }},
      { key: "version", label: "Ver", sortable: true, render: (v) => String(v ?? 0) },
      { key: "is_active", label: "Active", sortable: true, render: (v) => createBadge(Number(v) ? "YES" : "NO", Number(v) ? "ok" : "neutral") },
      { key: "draft_json", label: "Diff", sortable: false, render: (_v, row) => hasDiff(row) ? createBadge("CHANGES", "warn") : createBadge("OK", "ok") },
      { key: "published_at", label: "Published", sortable: true, render: (v) => (v ? new Date(String(v)).toLocaleDateString("fr-CA") : "-") },
      { key: "activated_at", label: "Activated", sortable: true, render: (v) => (v ? new Date(String(v)).toLocaleDateString("fr-CA") : "-") },
      {
        key: "created_at",
        label: "Timeline",
        sortable: false,
        render: (_v, row) => {
          const wrap = document.createElement("div");
          wrap.className = "ic-admin-timeline";
          const header = document.createElement("div");
          header.className = "ic-admin-timeline__header";
          header.appendChild(createBadge(`v${row.version ?? 0}`, "neutral"));
          header.appendChild(createBadge(row.state ?? "DRAFT", row.state === "PUBLISHED" ? "ok" : "warn"));
          if (Number(row.is_active)) header.appendChild(createBadge("ACTIVE", "ok"));
          const bar = document.createElement("div");
          bar.className = "ic-admin-timeline__bar";
          if (row.published_at) bar.classList.add("is-published");
          if (row.activated_at) bar.classList.add("is-active");
          const meta = document.createElement("div");
          meta.className = "ic-admin-timeline__meta";
          meta.textContent = `C ${row.created_at ? new Date(row.created_at).toLocaleDateString("fr-CA") : "—"} · P ${row.published_at ? new Date(row.published_at).toLocaleDateString("fr-CA") : "—"} · A ${row.activated_at ? new Date(row.activated_at).toLocaleDateString("fr-CA") : "—"}`;
          const note = document.createElement("div");
          note.className = "ic-admin-timeline__note";
          note.textContent = hasDiff(row) ? "Draft ≠ Published" : "Draft synchronisé";
          wrap.appendChild(header);
          wrap.appendChild(bar);
          wrap.appendChild(meta);
          wrap.appendChild(note);
          return wrap;
        },
      },
      {
        key: "status",
        label: "Status",
        sortable: true,
        render: (v) => createBadge(String(v), String(v) === "ACTIVE" ? "ok" : String(v) === "EXPERIMENTAL" ? "warn" : "neutral"),
      },
      { key: "module_id", label: "Module", sortable: true, render: (v) => String(v ?? "-") },
      { key: "feature_flag_id", label: "Flag", render: (v) => String(v ?? "-") },
    ];
    const actions = (row: CpPageRecord) => {
      const out: Array<{ label: string; onClick: () => void }> = [];
      out.push({
        label: "Diff",
        onClick: () => {
          if (!row.published_json && !row.draft_json) {
            studioStatus.textContent = "Aucune donnée pour comparer.";
            return;
          }
          const overlay = document.createElement("div");
          overlay.className = "ic-modal-overlay";
          const modal = document.createElement("div");
          modal.className = "ic-modal";
          const title = document.createElement("h2");
          title.className = "ic-modal__title";
          title.textContent = `Diff — ${row.route_id}`;
          const body = document.createElement("div");
          body.className = "ic-modal__message";
          const diffWrap = document.createElement("div");
          diffWrap.className = "ic-admin-diff";
          const leftPanel = document.createElement("div");
          leftPanel.className = "ic-admin-diff__panel";
          const rightPanel = document.createElement("div");
          rightPanel.className = "ic-admin-diff__panel";
          const leftJson = formatJson(row.published_json);
          const rightJson = formatJson(row.draft_json);
          const keyDiff = computeKeyDiff(row.published_json, row.draft_json);
          const keySet = new Set([...keyDiff.added, ...keyDiff.removed, ...keyDiff.changed]);
          const chips = document.createElement("div");
          chips.className = "ic-admin-diff__chips";
          const addChip = (label: string, keys: string[], tone: "ok" | "warn" | "err") => {
            if (!keys.length) return;
            const wrap = document.createElement("div");
            wrap.className = "ic-admin-diff__chip-group";
            const title = document.createElement("span");
            title.className = "ic-admin-diff__chip-title";
            title.textContent = label;
            wrap.appendChild(title);
            keys.forEach((k) => {
              wrap.appendChild(createBadge(k, tone));
            });
            chips.appendChild(wrap);
          };
          addChip("Ajoutés", keyDiff.added, "ok");
          addChip("Modifiés", keyDiff.changed, "warn");
          addChip("Supprimés", keyDiff.removed, "err");
          if (!keyDiff.added.length && !keyDiff.changed.length && !keyDiff.removed.length) {
            chips.appendChild(createBadge("Aucun changement de clé", "neutral"));
          }
          body.appendChild(chips);
          const lines = diffLines(leftJson, rightJson, keySet);
          lines.left.forEach((line) => {
            const div = document.createElement("div");
            div.className = `ic-admin-diff__line is-${line.status}${line.keyHit ? " is-key" : ""}`;
            div.textContent = line.text || " ";
            leftPanel.appendChild(div);
          });
          lines.right.forEach((line) => {
            const div = document.createElement("div");
            div.className = `ic-admin-diff__line is-${line.status}${line.keyHit ? " is-key" : ""}`;
            div.textContent = line.text || " ";
            rightPanel.appendChild(div);
          });
          diffWrap.appendChild(leftPanel);
          diffWrap.appendChild(rightPanel);
          body.appendChild(diffWrap);
          const actions = document.createElement("div");
          actions.className = "ic-modal__actions";
          const closeBtn = document.createElement("button");
          closeBtn.className = "ic-admin-btn";
          closeBtn.textContent = "Fermer";
          closeBtn.onclick = () => overlay.remove();
          actions.appendChild(closeBtn);
          modal.appendChild(title);
          modal.appendChild(body);
          modal.appendChild(actions);
          overlay.appendChild(modal);
          overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
          document.body.appendChild(overlay);
        },
      });
      out.push({
        label: "Modifier",
        onClick: () => {
          if (!canUpdate) {
            studioStatus.textContent = "Droits insuffisants (update).";
            return;
          }
          editingId = row.id;
          editingVersion = typeof row.version === "number" ? row.version : null;
          (form.querySelector("[name=route_id]") as HTMLInputElement).value = row.route_id;
          (form.querySelector("[name=title]") as HTMLInputElement).value = row.title;
          (form.querySelector("[name=path]") as HTMLInputElement).value = row.path ?? "";
          (form.querySelector("[name=status]") as HTMLSelectElement).value = row.status;
          (form.querySelector("[name=module_id]") as HTMLInputElement).value = row.module_id ?? "";
          (form.querySelector("[name=feature_flag_id]") as HTMLInputElement).value = row.feature_flag_id ?? "";
          try {
            const perms = row.permissions_json ? JSON.parse(row.permissions_json) : [];
            (form.querySelector("[name=permissions]") as HTMLInputElement).value = Array.isArray(perms) ? perms.join(", ") : "";
          } catch {
            (form.querySelector("[name=permissions]") as HTMLInputElement).value = "";
          }
          (form.querySelector("button[type=submit]") as HTMLButtonElement).textContent = "Enregistrer";
        },
      });
      out.push({
        label: row.state === "PUBLISHED" ? "Republier" : "Publier",
        onClick: async () => {
          if (!canPublish) {
            studioStatus.textContent = "Droits insuffisants (publish).";
            return;
          }
          const result = await publishPage(row.id, row.version ?? 0);
          studioStatus.textContent = result.ok ? "Publié." : (result.error ?? "Erreur publish.");
          if (result.ok) await loadRows();
        },
      });
      out.push({
        label: row.is_active ? "Désactiver" : "Activer",
        onClick: async () => {
          if (!canActivate) {
            studioStatus.textContent = "Droits insuffisants (activate).";
            return;
          }
          if (!row.is_active && row.state !== "PUBLISHED") {
            studioStatus.textContent = "Publier avant activation.";
            return;
          }
          const result = row.is_active
            ? await deactivatePage(row.id, row.version ?? 0)
            : await activatePage(row.id, row.version ?? 0);
          studioStatus.textContent = result.ok ? (row.is_active ? "Désactivé." : "Activé.") : (result.error ?? "Erreur.");
          if (result.ok) await loadRows();
        },
      });
      if (row.published_json) {
        out.push({
          label: "Revert Draft",
          onClick: async () => {
            if (!canUpdate) {
              studioStatus.textContent = "Droits insuffisants (update).";
              return;
            }
            const result = await revertPage(row.id);
            studioStatus.textContent = result.ok ? "Revert effectué." : (result.error ?? "Erreur revert.");
            if (result.ok) await loadRows();
          },
        });
      }
      out.push({
        label: "Supprimer",
        onClick: async () => {
          if (!canDelete) {
            studioStatus.textContent = "Droits insuffisants (delete).";
            return;
          }
          if (!confirm(`Supprimer la page ${row.route_id} ?`)) return;
          const res = await fetch(`${getApiBase()}/api/cp/pages/${encodeURIComponent(row.id)}`, {
            method: "DELETE",
            headers: getAuthHeaders(),
          });
          const json = (await res.json()) as { success: boolean; error?: string };
          if (!res.ok || !json.success) {
            studioStatus.textContent = json.error || "Erreur suppression.";
            return;
          }
          await loadRows();
        },
      });
      return out;
    };
    tableHost.appendChild(createDataTable({ columns: cols, data: currentRows, pagination: true, pageSize: 10, actions }));
  };

  loadRows();
  content.appendChild(studioSection.card);

  const { card, body } = createSectionCard({
    title: "Pages Inventory",
    description: "Complete listing: Index, PageName, RouteId, Status, SourceFile, DuplicateGroup, Notes"
  });
  const tabs = document.createElement("div");
  tabs.className = "ic-admin-tabs";
  const tabCp = document.createElement("button");
  const tabClient = document.createElement("button");
  tabCp.className = `ic-admin-tab ${currentSurface === "CP" ? "is-active" : ""}`.trim();
  tabClient.className = `ic-admin-tab ${currentSurface === "CLIENT" ? "is-active" : ""}`.trim();
  tabCp.textContent = `Pages Inventory — CP (${computeKpis(CP_PAGES).total})`;
  tabClient.textContent = `Pages Inventory — Client (${computeKpis(CLIENT_PAGES).total})`;
  tabs.appendChild(tabCp);
  tabs.appendChild(tabClient);
  body.appendChild(tabs);

  const state = {
    search: readFilterFromUrl("q"),
    status: readFilterFromUrl("status"),
    registry: readFilterFromUrl("registry"),
  };
  const { element: toolbar, searchInput } = createToolbar({
    onSearch: (value) => {
      state.search = value;
      writeFilterToUrl({ q: state.search });
      renderTable();
    },
    searchPlaceholder: "Rechercher une page...",
    filters: [
      {
        label: "Status",
        value: state.status,
        options: [
          { value: "", label: "Tous" },
          { value: "ACTIVE", label: "ACTIVE" },
          { value: "EXPERIMENTAL", label: "EXPERIMENTAL" },
          { value: "HIDDEN", label: "HIDDEN" },
          { value: "UNKNOWN", label: "UNKNOWN" }
        ],
        onChange: (value) => {
          state.status = value;
          writeFilterToUrl({ status: state.status });
          renderTable();
        }
      },
      {
        label: "Registry",
        value: state.registry,
        options: [
          { value: "", label: "Tous" },
          { value: "yes", label: "In Registry" },
          { value: "no", label: "Not in Registry" }
        ],
        onChange: (value) => {
          state.registry = value;
          writeFilterToUrl({ registry: state.registry });
          renderTable();
        }
      }
    ],
    actions: [
      {
        label: "Exporter CSV",
        onClick: () => {
          const rows = getFilteredRows();
          const header = ["index","pageName","routeId","status","sourceFile","duplicateGroup","notes","inRegistry"];
          const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
          const lines = [header.map(escape).join(",")];
          rows.forEach((r) => {
            lines.push([
              r.index, r.pageName, r.routeId, r.status, r.sourceFile, r.duplicateGroup ?? "", r.notes ?? "", r.inRegistry ? "yes" : "no"
            ].map(escape).join(","));
          });
          const blob = new Blob([lines.join("\n")], { type: "text/csv" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `pages-${currentSurface.toLowerCase()}.csv`;
          a.click();
          URL.revokeObjectURL(url);
        }
      },
      {
        label: "Exporter JSON",
        onClick: () => {
          const rows = getFilteredRows();
          const blob = new Blob([JSON.stringify(rows, null, 2)], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `pages-${currentSurface.toLowerCase()}.json`;
          a.click();
          URL.revokeObjectURL(url);
        }
      },
      {
        label: "Reset filtres",
        onClick: () => {
          state.search = "";
          state.status = "";
          state.registry = "";
          if (searchInput) searchInput.value = "";
          writeFilterToUrl({ q: "", status: "", registry: "" });
          renderTable();
        }
      }
    ],
  });
  if (searchInput) searchInput.value = state.search;
  body.appendChild(toolbar);

  const statsRow = document.createElement("div");
  statsRow.className = "ic-admin-stats";
  const stats = {
    active: document.createElement("span"),
    experimental: document.createElement("span"),
    hidden: document.createElement("span"),
    unknown: document.createElement("span"),
    inRegistry: document.createElement("span"),
    notInRegistry: document.createElement("span"),
  };
  stats.active.className = "ic-admin-stat";
  stats.experimental.className = "ic-admin-stat";
  stats.hidden.className = "ic-admin-stat";
  stats.unknown.className = "ic-admin-stat";
  stats.inRegistry.className = "ic-admin-stat";
  stats.notInRegistry.className = "ic-admin-stat";
  statsRow.appendChild(stats.active);
  statsRow.appendChild(stats.experimental);
  statsRow.appendChild(stats.hidden);
  statsRow.appendChild(stats.unknown);
  statsRow.appendChild(stats.inRegistry);
  statsRow.appendChild(stats.notInRegistry);
  body.appendChild(statsRow);

  const tableContainer = document.createElement("div");
  body.appendChild(tableContainer);

  const columns: TableColumn<PageInventoryEntry>[] = [
    { key: "index", label: "Index", sortable: true, render: (v) => String(v) },
    { key: "pageName", label: "PageName", sortable: true },
    { key: "routeId", label: "RouteId", sortable: true },
    { 
      key: "status", 
      label: "Status", 
      sortable: true, 
      render: (v) => {
        const status = String(v);
        const tone = status === "ACTIVE" ? "ok" : status === "EXPERIMENTAL" ? "warn" : status === "HIDDEN" ? "neutral" : "err";
        return createBadge(status, tone);
      }
    },
    { key: "sourceFile", label: "SourceFile", sortable: true },
    { 
      key: "duplicateGroup", 
      label: "DuplicateGroup", 
      sortable: true,
      render: (v) => v ? createBadge(String(v), "warn") : "-"
    },
    { 
      key: "notes", 
      label: "Notes",
      render: (v) => v ? createBadge(String(v), "warn") : "-"
    }
  ];

  const getFilteredRows = () => {
    const baseRows = getSurfacePages();
    let rows = [...baseRows];
    if (state.search) {
      const q = state.search.toLowerCase();
      rows = rows.filter((r) =>
        r.pageName.toLowerCase().includes(q) ||
        r.routeId.toLowerCase().includes(q) ||
        r.sourceFile.toLowerCase().includes(q)
      );
    }
    if (state.status) {
      rows = rows.filter((r) => r.status === state.status);
    }
    if (state.registry === "yes") {
      rows = rows.filter((r) => r.inRegistry);
    }
    if (state.registry === "no") {
      rows = rows.filter((r) => !r.inRegistry);
    }
    return rows;
  };

  const renderTable = () => {
    tableContainer.innerHTML = "";
    const baseRows = getSurfacePages();
    const rows = getFilteredRows();
    tableContainer.appendChild(createDataTable({ columns, data: rows, pagination: true, pageSize: 15 }));

    const k = computeKpis(baseRows);
    const label = getSurfaceLabel();
    (card.querySelector(".ic-section-card__title") as HTMLElement).textContent = `Pages Inventory — ${label}`;
    const desc = card.querySelector(".ic-section-card__desc") as HTMLElement | null;
    if (desc) {
      desc.textContent = `Affichées ${rows.length} / ${baseRows.length} — filtres: ${state.search ? `recherche "${state.search}"` : "aucun"}${state.status ? `, status ${state.status}` : ""}${state.registry ? `, registry ${state.registry}` : ""}`;
    }
    const badgeRow = kpis.querySelectorAll(".ic-kpi__value");
    if (badgeRow.length >= 4) {
      const b0 = badgeRow[0];
      const b1 = badgeRow[1];
      const b2 = badgeRow[2];
      const b3 = badgeRow[3];
      if (b0) b0.textContent = String(k.total);
      if (b1) b1.textContent = String(k.active);
      if (b2) b2.textContent = String(k.experimental);
      if (b3) b3.textContent = String(k.inRegistry);
    }
    const byStatus = {
      active: baseRows.filter((r) => r.status === "ACTIVE").length,
      experimental: baseRows.filter((r) => r.status === "EXPERIMENTAL").length,
      hidden: baseRows.filter((r) => r.status === "HIDDEN").length,
      unknown: baseRows.filter((r) => r.status === "UNKNOWN").length,
      inRegistry: baseRows.filter((r) => r.inRegistry).length,
      notInRegistry: baseRows.filter((r) => !r.inRegistry).length,
    };
    stats.active.textContent = `ACTIVE: ${byStatus.active}`;
    stats.experimental.textContent = `EXPERIMENTAL: ${byStatus.experimental}`;
    stats.hidden.textContent = `HIDDEN: ${byStatus.hidden}`;
    stats.unknown.textContent = `UNKNOWN: ${byStatus.unknown}`;
    stats.inRegistry.textContent = `IN REGISTRY: ${byStatus.inRegistry}`;
    stats.notInRegistry.textContent = `OFF REGISTRY: ${byStatus.notInRegistry}`;
  };
  renderTable();

  const setTab = (surface: "CP" | "CLIENT") => {
    currentSurface = surface;
    tabCp.classList.toggle("is-active", surface === "CP");
    tabClient.classList.toggle("is-active", surface === "CLIENT");
    writeSurfaceToStorage(surface);
    writeSurfaceToUrl(surface);
    renderTable();
  };
  tabCp.onclick = () => setTab("CP");
  tabClient.onclick = () => setTab("CLIENT");

  window.addEventListener("hashchange", () => {
    const fromUrl = readSurfaceFromUrl();
    const nextSearch = readFilterFromUrl("q");
    const nextStatus = readFilterFromUrl("status");
    const nextRegistry = readFilterFromUrl("registry");
    if (fromUrl && fromUrl !== currentSurface) {
      currentSurface = fromUrl;
      tabCp.classList.toggle("is-active", currentSurface === "CP");
      tabClient.classList.toggle("is-active", currentSurface === "CLIENT");
      writeSurfaceToStorage(currentSurface);
    }
    if (nextSearch !== state.search || nextStatus !== state.status || nextRegistry !== state.registry) {
      state.search = nextSearch;
      state.status = nextStatus;
      state.registry = nextRegistry;
      if (searchInput) searchInput.value = state.search;
      const selects = Array.from(toolbar.querySelectorAll(".ic-toolbar__select")) as HTMLSelectElement[];
      if (selects[0]) selects[0].value = state.status || "";
      if (selects[1]) selects[1].value = state.registry || "";
    }
    renderTable();
  });

  content.appendChild(card);
  content.appendChild(createGovernanceFooter());
  root.appendChild(shell);
}
