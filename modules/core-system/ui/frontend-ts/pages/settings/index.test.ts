// @vitest-environment jsdom
// @vitest-environment-options { "url": "http://localhost" }
import { describe, expect, it } from "vitest";
import { renderSettingsPage } from "./index";

function buildLockedHeading(): string {
  return ["Id", "en", "ti", "té", " & ", "ma", "r", "que"].join("");
}

describe("settings page guard", () => {
  it("does not render identity header in settings page", () => {
    const root = document.createElement("div");
    renderSettingsPage(root);
    expect(root.textContent || "").not.toContain(buildLockedHeading());
  });
});
