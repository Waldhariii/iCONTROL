// @ts-nocheck
import { safeRender } from "../_shared/mainSystem.shared";
import { mountSections, type SectionSpec } from "../_shared/sections";
import { renderRecommendations } from "../_shared/recommendations";
import { getSafeMode } from "../_shared/recommendations.ctx";
import { sectionCard } from "../_shared/uiBlocks";
import { getSession } from "../_shared/localAuth";
import { renderAccessDenied } from "../_shared/renderAccessDenied";
import { canAccessPage, canAccessSection, type Role } from "../_shared/rolePolicy";
import { render_registry_viewer } from "./sections/registry-viewer";
import { render_contracts_table } from "./sections/contracts-table";
import { render_contracts_form } from "./sections/contracts-form";
import { render_datasources_viewer } from "./sections/datasources-viewer";
import { render_rules_viewer } from "./sections/rules-viewer";
import { render_audit_log } from "./sections/audit-log";


function __fmtTs(ts?: number) {
  try {
    if (typeof ts !== "number") return "n/a";

      {/* Cache Audit (read-only) */}
      {(() => {
        const a: any = __readCacheAudit();
        return (
          <div style={{ border: "1px solid var(--ic-borderLight)", borderRadius: 12, padding: 12, marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
              <div style={{ fontWeight: 700 }}>Cache Audit</div>
              <div style={{ opacity: 0.8, fontSize: 12 }}>{a?.ts ? __fmtTs(a.ts) : "n/a"}</div>
            </div>
            <div style={{ marginTop: 8, display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8, fontSize: 13 }}>
              <div><span style={{ opacity: 0.7 }}>schemaVersion:</span> <span>{typeof a?.schemaVersion === "number" ? a.schemaVersion : "n/a"}</span></div>
              <div><span style={{ opacity: 0.7 }}>swrDisabled:</span> <span>{typeof a?.swrDisabled === "boolean" ? String(a.swrDisabled) : "n/a"}</span></div>
              <div><span style={{ opacity: 0.7 }}>metricsDisabled:</span> <span>{typeof a?.metricsDisabled === "boolean" ? String(a.metricsDisabled) : "n/a"}</span></div>
              <div><span style={{ opacity: 0.7 }}>surface:</span> <span>{a ? "present" : "absent"}</span></div>
            </div>
            <div style={{ marginTop: 8, opacity: 0.7, fontSize: 12 }}>
              Read-only governance surface. Best-effort display.
            </div>
          </div>
        );
      })()}
    const d = new Date(ts);
    return isNaN(d.getTime()) ? "n/a" : d.toISOString();
  } catch { return "n/a"; }
}

function __readCacheAudit() {
  try {
    const w: any = globalThis as any;
    const a = w?.__cacheAudit;
    if (!a) return null;
    if (typeof a.snapshot === "function") return a.snapshot();
    return {
      schemaVersion: a.schemaVersion,
      ts: a.ts,
      swrDisabled: a.swrDisabled,
      metricsDisabled: a.metricsDisabled,
    };
  } catch { return null; }
}


export function renderDeveloper(root: HTMLElement): void {
  const sess = getSession();
  const role = (sess?.role || "USER") as Role;
  const safeMode = getSafeMode();

  const pageDecision = canAccessPage(role, "developer");
  if (!pageDecision.allow) {
    renderAccessDenied(root, pageDecision.reason);
    return;
  }

  const sections: SectionSpec[] = [
    {
      id: "developer-recommendations",
      title: "Recommandations",
      render: (host) => {
        renderRecommendations(host, {
          pageId: "developer",
          scopeId: "developer",
          role,
          safeMode
        });
      }
    },
    {
      id: "toolbox-registry-viewer",
      title: "Registry viewer",
      render: (host) => render_registry_viewer(host),
      requiresRoles: ["SYSADMIN", "DEVELOPER"]
    },
    {
      id: "toolbox-contracts-table",
      title: "Contracts: TableDef",
      render: (host) => render_contracts_table(host),
      requiresRoles: ["SYSADMIN", "DEVELOPER"]
    },
    {
      id: "toolbox-contracts-form",
      title: "Contracts: FormDef",
      render: (host) => render_contracts_form(host),
      requiresRoles: ["SYSADMIN", "DEVELOPER"]
    },
    {
      id: "toolbox-datasources",
      title: "Datasources",
      render: (host) => render_datasources_viewer(host, safeMode),
      requiresRoles: ["SYSADMIN", "DEVELOPER"]
    },
    {
      id: "toolbox-rules",
      title: "Rules",
      render: (host) => render_rules_viewer(host),
      requiresRole: "SYSADMIN"
    },
    {
      id: "developer-entitlements",
      title: "Entitlements (manual)",
      render: (host) => {
        const card = sectionCard("Manual Subscription Provisioning");
        const note = document.createElement("div");
        note.style.cssText = "opacity:.85;margin-bottom:8px";
        note.textContent = "Activer/désactiver plan et modules sans billing (local only).";
        const link = document.createElement("a");
        link.href = "#/developer/entitlements";
        link.textContent = "Ouvrir la page Entitlements";
        link.style.cssText = "display:inline-block;margin-top:4px";
        card.appendChild(note);
        card.appendChild(link);
        host.appendChild(card);
      },
      requiresRoles: ["SYSADMIN", "DEVELOPER"]
    },
    {
      id: "toolbox-audit-log",
      title: "Audit log",
      render: (host) => render_audit_log(host),
      requiresRoles: ["SYSADMIN", "DEVELOPER"]
    }
  ];

  const isAllowedForRole = (section: SectionSpec): boolean => {
    const decision = canAccessSection(role, section.id as never);
    return decision.allow;
  };

  const allowedSections = sections.filter(isAllowedForRole);
  const hiddenSections = sections.filter((s) => !isAllowedForRole(s));

  safeRender(root, () => {
    root.innerHTML = "";
    if (hiddenSections.length > 0) {
      const card = sectionCard("Sections réservées");
      card.setAttribute("data-testid", "sections-reserved");
      const note = document.createElement("div");
      note.style.cssText = "opacity:.8;margin-bottom:8px";
      note.textContent = "Certaines sections sont visibles uniquement pour SYSADMIN.";
      card.appendChild(note);
      const list = document.createElement("ul");
      list.style.cssText = "margin:0;padding-left:18px;opacity:.9";
      hiddenSections.forEach((s) => {
        const li = document.createElement("li");
        li.textContent = `${s.title} (${s.id})`;
        list.appendChild(li);
      });
      card.appendChild(list);
      root.appendChild(card);
    }
    mountSections(root, allowedSections, { page: "developer", role, safeMode });
  });
}

export const developerSections = [
  "toolbox-registry-viewer",
  "toolbox-contracts-table",
  "toolbox-contracts-form",
  "toolbox-datasources",
  "toolbox-rules",
  "developer-entitlements",
  "toolbox-audit-log"
];
