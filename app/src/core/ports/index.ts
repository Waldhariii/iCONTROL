/**
 * SSOT Ports Index (contract-first)
 * Rule: CP/APP import ports ONLY from this file.
 * Goal: prevent symbol drift and cross-file ad-hoc imports.
 */

// Facades (boundary-safe factories)
export * from "./activationRegistry.facade";
export * from "./policyEngine.facade";

// Bootstrap / wiring
export * from "./cpEnforcement.bootstrap";
export * from "./cpEnforcement.wiring";
