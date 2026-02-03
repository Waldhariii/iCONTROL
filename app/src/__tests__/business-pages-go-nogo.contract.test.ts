import { describe, it, expect } from "vitest";
import { execSync } from "node:child_process";
import path from "node:path";

describe("gate:business-pages-go-nogo (contract)", () => {
  it("runs and emits OK or fails with ERR_PAGES_METIER_GONOGO", () => {
    const root = execSync("git rev-parse --show-toplevel", { encoding: "utf8" }).trim();
    try{
      const out = execSync(`node ${path.join(root, "scripts/gates/check-business-pages-go-nogo.mjs")}`, { encoding: "utf8" });
      expect(out).toContain("OK:");
    }catch(e){
      expect(String(e.stderr || e.stdout || e.message)).toBeTruthy();
    }
  });
});
