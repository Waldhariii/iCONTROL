// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost" }
import { describe, expect, it } from "vitest";
import { renderSettingsPage } from "./index";

describe("settings page branding guard", () => {
  it("does not render Identité & marque in settings", () => {
    const root = document.createElement("div");
    renderSettingsPage(root);
    expect(root.textContent || "").not.toContain("Identité & marque");
  });
});
