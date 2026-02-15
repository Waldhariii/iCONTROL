import { readdirSync, statSync, readFileSync } from "fs";
import { join } from "path";
import { validateOrThrow } from "./validate.mjs";

const specificMap = new Map([
  ["page_definitions.json", "page_definition.v1"],
  ["page_instances.json", "page_version.v1"],
  ["route_specs.json", "route_spec.v1"],
  ["design_tokens.json", "design_token.v1"],
  ["themes.json", "theme.v1"],
  ["active_release.json", "active_release.v1"],
  ["break_glass.json", "break_glass.v1"],
  ["change_freeze.json", "change_freeze.v1"],
  ["plans.json", "plan.v1"],
  ["plan_versions.json", "plan_version.v1"],
  ["tenant_overrides.json", "tenant_override.v1"],
  ["tenant_quotas.json", "tenant_quota.v1"],
  ["metering_catalog.json", "metering_catalog.v1"],
  ["metering_versions.json", "metering_version.v1"],
  ["rate_cards.json", "rate_card.v1"],
  ["budgets.json", "budget.v1"],
  ["qos_policies.json", "qos_policy.v1"],
  ["qos_versions.json", "qos_version.v1"],
  ["extensions.json", "extension.v1"],
  ["extension_versions.json", "extension_version.v1"],
  ["publishers.json", "extension_publisher.v1"],
  ["extension_permissions.json", "extension_permissions.v1"],
  ["extension_installations.json", "extension_installation.v1"],
  ["extension_reviews.json", "extension_review.v1"],
  ["extension_killswitch.json", "extension_killswitch.v1"],
  ["data_sources.json", "data_source.v1"],
  ["data_models.json", "data_model.v1"],
  ["data_model_versions.json", "data_model_version.v1"],
  ["data_fields.json", "data_field.v1"],
  ["data_classifications.json", "data_classification.v1"],
  ["retention_policies.json", "retention_policy.v1"],
  ["retention_versions.json", "retention_version.v1"],
  ["deletion_policies.json", "deletion_policy.v1"],
  ["deletion_versions.json", "deletion_version.v1"],
  ["export_controls.json", "export_control.v1"],
  ["export_control_versions.json", "export_control_version.v1"],
  ["connectors.json", "connector.v1"],
  ["connector_versions.json", "connector_version.v1"],
  ["connector_configs.json", "connector_config.v1"],
  ["webhooks.json", "webhook.v1"],
  ["event_subscriptions.json", "event_subscription.v1"],
  ["event_dead_letters.json", "event_dead_letter.v1"],
  ["integration_audit.json", "integration_audit.v1"],
  ["secrets_vault_refs.json", "secret_vault_ref.v1"],
  ["slo_definitions.json", "slo_definition.v1"],
  ["slo_versions.json", "slo_version.v1"],
  ["sli_sources.json", "sli_source.v1"],
  ["error_budget_policies.json", "error_budget_policy.v1"],
  ["canary_policies.json", "canary_policy.v1"],
  ["runbooks.json", "runbook.v1"],
  ["runbook_versions.json", "runbook_version.v1"],
  ["mitigation_policies.json", "mitigation_policy.v1"],
  ["mitigation_versions.json", "mitigation_version.v1"],
  ["incident_severities.json", "incident_severity.v1"]
]);

function inferSchemaForFile(path, data) {
  const base = path.split("/").slice(-1)[0];
  if (specificMap.has(base)) return specificMap.get(base);
  if (Array.isArray(data) && data.every((x) => typeof x === "string")) return "array_of_strings.v1";
  return "array_of_objects.v1";
}

export function validateSsotDir(ssotDir) {
  const skipDirs = [
    "/changes/changesets",
    "/changes/reviews",
    "/changes/releases",
    "/changes/snapshots"
  ];
  function walk(dir) {
    const entries = readdirSync(dir);
    for (const e of entries) {
      const p = join(dir, e);
      const st = statSync(p);
      if (st.isDirectory()) {
        if (skipDirs.some((s) => p.includes(s))) continue;
        walk(p);
      }
      else if (e.endsWith(".json")) validateFile(p);
    }
  }

  function validateFile(path) {
    const data = JSON.parse(readFileSync(path, "utf-8"));
    const schemaId = inferSchemaForFile(path, data);
    if (Array.isArray(data) && schemaId !== "array_of_objects.v1" && schemaId !== "array_of_strings.v1") {
      for (const item of data) validateOrThrow(schemaId, item, path);
      return;
    }
    validateOrThrow(schemaId, data, path);
  }

  walk(ssotDir);
  return true;
}
