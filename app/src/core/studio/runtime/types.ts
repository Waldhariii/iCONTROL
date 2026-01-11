import type { Claims, Role } from "../../governance/rbac";
import type { ComponentRegistry } from "../registry";
import type { DataSources } from "../datasources";
import type { BlueprintDoc } from "../blueprints/types";
import type { Rule } from "../rules/types";
import type { Permission } from "../internal/rbac";

export type RuntimeDeps = {
  claims: Claims;
  // Optional: role floor for runtime operations
  requiredRole?: Role;
  registry: ComponentRegistry;
  datasources: DataSources;
  rules: Rule[];
};

export type RenderRequest = {
  blueprint: BlueprintDoc;
};

export type Rendered = {
  html: string;
  // Expand later: diagnostics, warnings, trace id
};

export type RenderOp =
  | { op: "text"; value: string }
  | { op: "component"; id: string; props?: Record<string, unknown> };

export type RenderPlan = {
  ops: RenderOp[];
  /**
   * Optional RBAC requirements for executing the plan.
   * Enforced by executePlan() prior to rendering.
   */
  requires?: Permission[];
};
