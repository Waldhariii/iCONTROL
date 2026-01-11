// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost" }
import { describe, it, expect } from "vitest";
import { renderRecommendations } from "./recommendations";
import { getAuditLog, clearAuditLog } from "./audit";
import { OBS } from "./obsCodes";

describe("recommendations SSOT contract", () => {
  it("renders stable container and emits a single OBS entry", () => {
    clearAuditLog();
    const root = document.createElement("div");

    renderRecommendations(root, {
      pageId: "dossiers",
      scopeId: "dossiers.rules",
      role: "ADMIN",
      safeMode: "STRICT",
      entityType: "dossier",
      entityState: "OPEN"
    });

    const t = root.textContent || "";
    expect(t).toContain("Recommandations");

    const log = getAuditLog();
    const recos = log.filter((e) => e.code === OBS.INFO_RECOMMENDATIONS_SHOWN);
    expect(recos.length).toBe(1);
    expect(recos[0]?.detail || "").toContain("count=");
  });

  it("does not emit when no recommendations are produced", () => {
    clearAuditLog();
    const root = document.createElement("div");

    renderRecommendations(root, {
      pageId: "unknown",
      scopeId: "unknown",
      role: "ADMIN",
      safeMode: "COMPAT"
    });

    const log = getAuditLog();
    const recos = log.filter((e) => e.code === OBS.INFO_RECOMMENDATIONS_SHOWN);
    expect(recos.length).toBe(0);
  });
});
