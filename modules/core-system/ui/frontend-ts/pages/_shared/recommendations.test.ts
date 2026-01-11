import { describe, it, expect } from "vitest";
import { buildRecommendations } from "./recommendations";

describe("recommendations SSOT", () => {
  it("emits SAFE_MODE STRICT warning for dossiers", () => {
    const recos = buildRecommendations({
      pageId: "dossiers",
      scopeId: "dossiers.rules",
      role: "ADMIN",
      safeMode: "STRICT",
      entityType: "dossier",
      entityState: "OPEN"
    });
    expect(recos.some((r) => r.id === "safe_mode_strict" && r.level === "WARN")).toBe(true);
  });

  it("emits BLOCKED guidance when entity is BLOCKED", () => {
    const recos = buildRecommendations({
      pageId: "dossiers",
      scopeId: "dossiers.detail",
      role: "DEVELOPER",
      safeMode: "COMPAT",
      entityType: "dossier",
      entityState: "BLOCKED",
      blockedReason: "paiement manquant"
    });
    expect(recos.some((r) => r.id === "dossier_blocked")).toBe(true);
  });
});
