import { describe, it, expect } from "vitest";
import { applyThemeTokensToCSSVars } from "../../../modules/core-system/ui/frontend-ts/pages/_shared/themeCssVars";

describe("theme css vars (contract)", () => {
  it("applique les variables CSS --ic-* sur :root", () => {
    const vars: Record<string, string> = {};
    const doc = {
      documentElement: {
        style: {
          setProperty: (k: string, v: string) => { vars[k] = v; },
          getPropertyValue: (k: string) => vars[k] || "",
        },
      },
    } as Document;

    applyThemeTokensToCSSVars(doc);

    const style = doc.documentElement.style;
    const keys = [
      "--ic-text",
      "--ic-border",
      "--ic-mutedText",
      "--ic-card",
      "--ic-panel",
      "--ic-accent",
      "--ic-accent2",
    ];

    for (const k of keys) {
      const v = style.getPropertyValue(k);
      expect(v, `missing css var ${k}`).toBeTruthy();
    }
  });
});
