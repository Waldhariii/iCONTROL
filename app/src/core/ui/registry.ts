/**
 * UI Component Registry (SSOT) — Control Plane/Admin
 * Objectif: inventorier les composants UI partagés + leurs classes canoniques,
 * et servir de référence aux gates (report-only au départ).
 *
 * Règles:
 * - Chaque composant doit avoir un "id" stable et une "classBase" canonique.
 * - Les classes doivent exister dans STYLE_ADMIN_FINAL.css (scope CP) pour la cohérence visuelle.
 * - Les exceptions doivent être documentées explicitement ici (reason + portée).
 */

export type UiComponentId =
  | "button"
  | "badge"
  | "toolbar"
  | "sectionCard"
  | "pageShell"
  | "dataTable"
  | "confirmModal"
  | "emptyState"
  | "errorState"
  | "toast"
  | "skeletonLoader"
  | "uiBlocks-table"
  | "uiBlocks-actionRow"
  | "uiBlocks-pillRow"
  | "uiBlocks-input"
  | "uiBlocks-noticeCard"
  ;

export interface UiComponentRegistryEntry {
  id: UiComponentId;
  /** Source file(s) (relative) that own/define the component */
  sources: string[];
  /** Canonical base class the component must apply (or include) */
  classBase: string;
  /** Optional: additional classes expected (non-exhaustive) */
  classHints?: string[];
  /** Optional: dataset attributes used as contract */
  datasets?: string[];
  /** Optional: allowed inline style keys (ONLY when unavoidable) */
  allowedInlineStyles?: string[];
  /** Optional: explicit exceptions (must be justified) */
  exceptions?: Array<{ reason: string; scope: string }>;
}

export const UI_COMPONENT_REGISTRY: UiComponentRegistryEntry[] = [
  { id: "button", sources: ["app/src/core/ui/button.ts"], classBase: "ic-btn", classHints: ["ic-btn--primary","ic-btn--secondary","ic-btn--danger","ic-btn--ghost"], datasets: [], allowedInlineStyles: [] },
  { id: "badge", sources: ["app/src/core/ui/badge.ts"], classBase: "ic-badge", datasets: ["data-tone"], allowedInlineStyles: [] },
  { id: "toolbar", sources: ["app/src/core/ui/toolbar.ts"], classBase: "ic-toolbar", classHints: ["ic-toolbar__search","ic-toolbar__actions","ic-toolbar__select"], allowedInlineStyles: [] },
  { id: "sectionCard", sources: ["app/src/core/ui/sectionCard.ts"], classBase: "ic-section-card", classHints: ["ic-section-card__header","ic-section-card__body"], allowedInlineStyles: [] },
  { id: "pageShell", sources: ["app/src/core/ui/pageShell.ts"], classBase: "ic-page-shell", classHints: ["ic-page-shell__header","ic-page-shell__content"], allowedInlineStyles: [] },
  { id: "dataTable", sources: ["app/src/core/ui/dataTable.ts"], classBase: "ic-table", classHints: ["ic-table__wrap","ic-table__table","ic-table__pagination"], allowedInlineStyles: [] },
  { id: "confirmModal", sources: ["app/src/core/ui/confirmModal.ts"], classBase: "ic-modal", classHints: ["ic-modal-overlay","ic-modal__actions"], allowedInlineStyles: [] },
  { id: "emptyState", sources: ["app/src/core/ui/emptyState.ts"], classBase: "ic-empty-state", classHints: ["ic-empty-card"], allowedInlineStyles: [] },
  { id: "errorState", sources: ["app/src/core/ui/errorState.ts"], classBase: "ic-error-state", classHints: ["ic-error-state__actions"], allowedInlineStyles: [] },
  { id: "toast", sources: ["app/src/core/ui/toast.ts", "modules/core-system/ui/frontend-ts/pages/_shared/uiBlocks.ts"], classBase: "ic-toast", datasets: ["data-status"], allowedInlineStyles: [] },
  { id: "skeletonLoader", sources: ["app/src/core/ui/skeletonLoader.ts"], classBase: "ic-skel", classHints: ["ic-skel__shimmer"], allowedInlineStyles: ["height"] },

  { id: "uiBlocks-table", sources: ["modules/core-system/ui/frontend-ts/pages/_shared/uiBlocks.ts"], classBase: "cxTable", classHints: ["cxTable__row","cxTable__cell","cxTable__th"], allowedInlineStyles: [] },
  { id: "uiBlocks-actionRow", sources: ["modules/core-system/ui/frontend-ts/pages/_shared/uiBlocks.ts"], classBase: "cxActionRow", classHints: ["cxActionBtn"], allowedInlineStyles: [] },
  { id: "uiBlocks-pillRow", sources: ["modules/core-system/ui/frontend-ts/pages/_shared/uiBlocks.ts"], classBase: "cxPillRow", classHints: ["cxPill"], allowedInlineStyles: [] },
  { id: "uiBlocks-input", sources: ["modules/core-system/ui/frontend-ts/pages/_shared/uiBlocks.ts"], classBase: "cxInput", allowedInlineStyles: [] },
  { id: "uiBlocks-noticeCard", sources: ["modules/core-system/ui/frontend-ts/pages/_shared/uiBlocks.ts","modules/core-system/ui/frontend-ts/pages/_shared/sections.ts"], classBase: "cxNoticeCard", classHints: ["cxNoticeTitle","cxNoticeMeta","cxNoticeMsg","cxNoticeBody"], allowedInlineStyles: [] },
];

/** Convenience lookups */
export const UI_COMPONENT_IDS = new Set(UI_COMPONENT_REGISTRY.map((x) => x.id));
export const UI_COMPONENT_CLASSES = new Set(UI_COMPONENT_REGISTRY.map((x) => x.classBase));
