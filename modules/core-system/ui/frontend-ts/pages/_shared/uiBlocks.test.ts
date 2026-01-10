// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost" }
import { describe, expect, it } from "vitest";
import { appendActionRow, appendTable, buildCsv } from "./uiBlocks";

function makeHost(): HTMLElement {
  const host = document.createElement("div");
  document.body.appendChild(host);
  return host;
}

describe("uiBlocks accessibility", () => {
  it("adds aria-label to action buttons", () => {
    const host = makeHost();
    const row = appendActionRow(host, [
      { id: "nav", label: "Navigate", type: "navigate", payload: "#/dashboard" },
      { id: "noop", label: "No-op", type: "noop" }
    ]);
    const btns = row.querySelectorAll("button");
    expect(btns.length).toBe(2);
    btns.forEach((b) => {
      expect(b.getAttribute("aria-label") || "").toBeTruthy();
    });
  });

  it("renders empty table row and caps large tables", () => {
    const host = makeHost();
    appendTable(host, ["A"], []);
    expect(host.textContent || "").toContain("Aucune donnée");

    const bigHost = makeHost();
    const rows = Array.from({ length: 205 }).map((_, idx) => ({ A: String(idx) }));
    appendTable(bigHost, ["A"], rows);
    expect(bigHost.textContent || "").toContain("Affichage limité");
  });

  it("caps CSV export rows to 200", () => {
    const host = makeHost();
    appendActionRow(host, [{ id: "exp", label: "Export", type: "exportCsv" }]);
    const rows = Array.from({ length: 250 }).map((_, idx) => ({ A: String(idx), B: "x" }));
    const result = buildCsv(rows, 200);
    expect(result.rowCount).toBe(200);
    const lines = result.csv.trim().split("\n");
    expect(lines.length).toBe(201);
  });
});
