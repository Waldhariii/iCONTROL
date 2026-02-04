import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

function read(rel: string) {
  return fs.readFileSync(path.resolve(__dirname, "..", rel), "utf-8");
}

function assertNoLocalGenerators(src: string, label: string) {
  expect(src.includes("function getTenantId("), `${label}: local getTenantId() forbidden`).toBe(false);
  expect(src.includes("function getCorrelationId("), `${label}: local getCorrelationId() forbidden`).toBe(false);
  expect(src.includes('tenantId = "default"'), `${label}: hardcoded tenant forbidden`).toBe(false);
  expect(src.includes("Math.random()"), `${label}: Math.random usage should not be used for correlation`).toBe(false);
}

describe("tenant + correlation SSOT rollout (contract)", () => {
  it("login + gallery surfaces consume SSOT tenant/correlation helpers", () => {
    const login = read("surfaces/app/login/Page.tsx");
    const gallery = read("surfaces/app/gallery/Page.tsx");

    assertNoLocalGenerators(login, "login");
    assertNoLocalGenerators(gallery, "gallery");

    expect(login.includes("getTenantIdSSOT"), "login must use getTenantIdSSOT").toBe(true);
    expect(login.includes("newCorrelationIdSSOT"), "login must use newCorrelationIdSSOT").toBe(true);

    expect(gallery.includes("getTenantIdSSOT"), "gallery must use getTenantIdSSOT").toBe(true);
    expect(gallery.includes("newCorrelationIdSSOT"), "gallery must use newCorrelationIdSSOT").toBe(true);
  });
});
