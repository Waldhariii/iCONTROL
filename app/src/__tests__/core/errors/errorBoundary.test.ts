/**
 * ICONTROL_ERROR_BOUNDARY_TEST_V1
 * Tests pour error boundary
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { errorBoundary, createErrorFallbackUI } from "../../../core/errors/errorBoundary";

describe("ErrorBoundary", () => {
  beforeEach(() => {
    errorBoundary.clearErrors();
  });

  it("should capture errors", () => {
    const error = new Error("Test error");
    const errorInfo = errorBoundary.captureError(error, "TestComponent");

    expect(errorInfo).toBeDefined();
    expect(errorInfo.message).toBe("Test error");
    expect(errorInfo.component).toBe("TestComponent");
    expect(errorInfo.correlationId).toBeDefined();
  });

  it("should track recent errors", () => {
    errorBoundary.captureError(new Error("Error 1"), "Comp1");
    errorBoundary.captureError(new Error("Error 2"), "Comp2");
    errorBoundary.captureError(new Error("Error 3"), "Comp3");

    const recent = errorBoundary.getRecentErrors(2);
    expect(recent.length).toBe(2);
    expect(recent[1].message).toBe("Error 3");
    expect(recent[0].message).toBe("Error 2");
  });

  it("should limit error count", () => {
    for (let i = 0; i < 60; i++) {
      errorBoundary.captureError(new Error(`Error ${i}`), "Test");
    }

    const recent = errorBoundary.getRecentErrors();
    expect(recent.length).toBeLessThanOrEqual(50);
  });

  it("should create error fallback UI", () => {
    const errorInfo = errorBoundary.captureError(new Error("Test"), "TestComp");
    const container = document.createElement("div");
    const fallback = createErrorFallbackUI(errorInfo);

    expect(fallback).toBeInstanceOf(HTMLElement);
    expect(fallback.querySelector("h2")).toBeTruthy();
    expect(fallback.textContent).toContain("erreur");
  });
});
