// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost" }
import { describe, expect, it } from "vitest";
import { clearAuditLog, getAuditLog } from "./audit";
import { OBS } from "./obsCodes";
import { appendActionRow, appendTable, bindActions, buildCsv, blockActionBar, blockKeyValueTable, blockToggle } from "./uiBlocks";

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

  it("logs blocked actions for observability", () => {
    clearAuditLog();
    const host = makeHost();
    const row = appendActionRow(host, [{ id: "nav", label: "Nav", type: "navigate", payload: "#/nope" }]);
    bindActions(row, [{ id: "nav", label: "Nav", type: "navigate", payload: "#/nope" }], {
      allowRoutes: []
    });
    const btn = row.querySelector("button[data-action-id='nav']") as HTMLButtonElement | null;
    btn?.click();
    const log = getAuditLog();
    expect(log.some((entry) => entry.code === OBS.WARN_ACTION_BLOCKED)).toBe(true);
  });

  it("blocks export in SAFE_MODE strict", () => {
    clearAuditLog();
    (globalThis as any).ICONTROL_SAFE_MODE = "STRICT";
    const host = makeHost();
    const row = appendActionRow(host, [{ id: "exp", label: "Export", type: "exportCsv" }]);
    bindActions(row, [{ id: "exp", label: "Export", type: "exportCsv" }], {
      allowRoutes: ["#/dashboard"],
      exportRows: [{ A: "1" }]
    });
    const btn = row.querySelector("button[data-action-id='exp']") as HTMLButtonElement | null;
    btn?.click();
    const log = getAuditLog();
    expect(log.some((entry) => entry.code === OBS.WARN_ACTION_BLOCKED)).toBe(true);
    (globalThis as any).ICONTROL_SAFE_MODE = "COMPAT";
  });

  it("renders blockToggle with deterministic state", () => {
    const host = makeHost();
    const toggle = blockToggle({
      id: "t1",
      label: "Flag A",
      description: "Toggle test",
      checked: true,
      onChange: () => {}
    });
    host.appendChild(toggle);
    const input = host.querySelector("input#t1") as HTMLInputElement | null;
    expect(input?.checked).toBe(true);
  });

  it("renders blockKeyValueTable rows", () => {
    const host = makeHost();
    const table = blockKeyValueTable({
      title: "KV",
      rows: [{ key: "A", value: "1" }, { key: "B", value: "2" }]
    });
    host.appendChild(table);
    expect(host.textContent || "").toContain("A");
    expect(host.textContent || "").toContain("2");
  });

  it("blocks export in SAFE_MODE strict via actionbar", () => {
    clearAuditLog();
    const host = makeHost();
    const bar = blockActionBar({
      title: "Actions",
      actions: [{ id: "exp", label: "Export", type: "exportCsv", payload: "" }],
      allowRoutes: ["#/dashboard"],
      exportRows: [{ A: "1" }],
      safeMode: "STRICT"
    });
    host.appendChild(bar);
    const btn = host.querySelector("button[data-action-id='exp']") as HTMLButtonElement | null;
    btn?.click();
    const log = getAuditLog();
    expect(log.some((entry) => entry.code === OBS.WARN_SAFE_MODE_WRITE_BLOCKED)).toBe(true);
  });

  it("hides write actions in SAFE_MODE strict", () => {
    const host = makeHost();
    const bar = blockActionBar({
      title: "Actions",
      actions: [{ id: "write", label: "Write", type: "noop", write: true }],
      allowRoutes: ["#/dashboard"],
      role: "ADMIN",
      allowedRoles: ["SYSADMIN", "DEVELOPER", "ADMIN"],
      safeMode: "STRICT"
    });
    host.appendChild(bar);
    const btn = host.querySelector("button[data-action-id='write']") as HTMLButtonElement | null;
    expect(btn?.style.display).toBe("none");
  });
});
