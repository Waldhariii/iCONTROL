export type SchemaVersion = { name: string; version: number };

export type MigrationStep = {
  from: SchemaVersion;
  to: SchemaVersion;
  apply: (tenantId: string) => Promise<void>;
  rollback?: (tenantId: string) => Promise<void>;
};

export type MigrationPlan = {
  name: string;
  steps: MigrationStep[];
};

export async function runMigrationPlan(plan: MigrationPlan, tenantId: string): Promise<void> {
  if (!tenantId) throw Object.assign(new Error("tenantId required"), { code: "ERR_TENANT_REQUIRED" });
  for (const step of plan.steps) {
    await step.apply(tenantId);
  }
}
