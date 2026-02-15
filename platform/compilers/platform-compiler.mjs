import { readJson, writeJson, stableStringify, sha256, signPayload, readKey, writeText } from "./utils.mjs";
import { validateOrThrow } from "../../core/contracts/schema/validate.mjs";

export function compilePlatform({ ssotDir, outDir, releaseId, env, privateKeyPath }) {
  const routeCatalog = readJson(`${outDir}/route_catalog.${releaseId}.json`);
  const navManifest = readJson(`${outDir}/nav_manifest.${releaseId}.json`);
  const themeManifest = readJson(`${outDir}/theme_manifest.${releaseId}.json`);
  const guards = readJson(`${outDir}/guards.${releaseId}.json`);
  const renderGraph = readJson(`${outDir}/render_graph.${releaseId}.json`);
  const datasourceContracts = readJson(`${outDir}/datasource_contracts.${releaseId}.json`);
  const workflowDags = readJson(`${outDir}/workflow_dags.${releaseId}.json`);

  const capabilities = readJson(`${ssotDir}/registry/capabilities.json`);
  const modules = readJson(`${ssotDir}/registry/modules.json`);
  const entitlements = readJson(`${ssotDir}/tenancy/entitlements.json`);
  const plans = readJson(`${ssotDir}/tenancy/plans.json`);
  const planVersions = readJson(`${ssotDir}/tenancy/plan_versions.json`);
  const tenantEntitlements = readJson(`${ssotDir}/tenancy/tenant_entitlements.json`);
  const tenantQuotas = readJson(`${ssotDir}/tenancy/tenant_quotas.json`);
  const meteringCatalog = readJson(`${ssotDir}/finops/metering_catalog.json`);
  const budgetPolicies = readJson(`${ssotDir}/finops/budgets.json`);
  const qosPolicies = readJson(`${ssotDir}/qos/qos_policies.json`);
  const extensionInstalls = readJson(`${ssotDir}/extensions/extension_installations.json`);
  const extensionPermissions = readJson(`${ssotDir}/extensions/extension_permissions.json`);
  const extensionVersions = readJson(`${ssotDir}/extensions/extension_versions.json`);
  const extensionKillswitch = readJson(`${ssotDir}/extensions/extension_killswitch.json`);
  const dataSources = readJson(`${ssotDir}/data/catalog/data_sources.json`);
  const dataModels = readJson(`${ssotDir}/data/catalog/data_models.json`);
  const dataModelVersions = readJson(`${ssotDir}/data/catalog/data_model_versions.json`);
  const dataFields = readJson(`${ssotDir}/data/catalog/data_fields.json`);
  const dataClassifications = readJson(`${ssotDir}/data/catalog/data_classifications.json`);
  const retentionPolicies = readJson(`${ssotDir}/data/policies/retention_policies.json`);
  const exportControls = readJson(`${ssotDir}/data/policies/export_controls.json`);
  const connectors = readJson(`${ssotDir}/integrations/connectors.json`);
  const connectorVersions = readJson(`${ssotDir}/integrations/connector_versions.json`);
  const connectorConfigs = readJson(`${ssotDir}/integrations/connector_configs.json`);
  const webhooks = readJson(`${ssotDir}/integrations/webhooks.json`);
  const eventSubscriptions = readJson(`${ssotDir}/integrations/event_subscriptions.json`);
  const secretsVaultRefs = readJson(`${ssotDir}/integrations/secrets_vault_refs.json`);
  const sloDefinitions = readJson(`${ssotDir}/sre/slo_definitions.json`);
  const sloVersions = readJson(`${ssotDir}/sre/slo_versions.json`);
  const sliSources = readJson(`${ssotDir}/sre/sli_sources.json`);
  const errorBudgetPolicies = readJson(`${ssotDir}/sre/error_budget_policies.json`);
  const canaryPolicies = readJson(`${ssotDir}/sre/canary_policies.json`);
  const runbooks = readJson(`${ssotDir}/ops/runbooks.json`);
  const runbookVersions = readJson(`${ssotDir}/ops/runbook_versions.json`);
  const mitigationPolicies = readJson(`${ssotDir}/ops/mitigation_policies.json`);
  const mitigationVersions = readJson(`${ssotDir}/ops/mitigation_versions.json`);
  const incidentSeverities = readJson(`${ssotDir}/ops/incident_severities.json`);

  const qosRuntimeConfig = planVersions.map((pv) => {
    const policy = qosPolicies.find((p) => p.tier === pv.perf_tier) || null;
    return {
      plan_id: pv.plan_id,
      version: pv.version,
      tier: pv.perf_tier,
      priority_weight: pv.priority_weight,
      rate_limits: pv.rate_limits,
      compute_budgets: pv.compute_budgets,
      storage_quotas: pv.storage_quotas,
      ocr_quotas: pv.ocr_quotas,
      workflow_quotas: pv.workflow_quotas,
      observability: pv.observability,
      budgets: pv.budgets,
      qos_policy: policy
    };
  });

  const extensionsRuntime = extensionInstalls
    .filter((i) => i.state === "installed")
    .filter((i) => !extensionKillswitch.some((k) => k.extension_id === i.extension_id && k.enabled))
    .map((i) => {
      const perms = extensionPermissions.find((p) => p.extension_id === i.extension_id);
      const ver = extensionVersions.find((v) => v.extension_id === i.extension_id && v.version === i.version);
      return {
        tenant_id: i.tenant_id,
        extension_id: i.extension_id,
        version: i.version,
        requested_capabilities: perms?.requested_capabilities || [],
        hooks: ver?.hooks || []
      };
    });

  const dataCatalog = {
    data_sources: dataSources,
    data_models: dataModels,
    data_model_versions: dataModelVersions,
    data_fields: dataFields,
    data_classifications: dataClassifications
  };

  const manifest = {
    manifest_id: `manifest:${releaseId}`,
    manifest_version: "1.0.0",
    manifest_env: env,
    release_id: releaseId,
    signature: "",
    checksums: {},
    compat_matrix: { runtime: ">=1.0.0" },
    routes: routeCatalog,
    nav: navManifest,
    pages: renderGraph,
    widgets: renderGraph.widgets || [],
    themes: themeManifest,
    permissions: guards,
    datasources: datasourceContracts,
    workflows: workflowDags,
    capabilities,
    modules,
    entitlements,
    plans,
    plan_versions: planVersions,
    tenant_entitlements: tenantEntitlements,
    tenant_quotas: tenantQuotas,
    metering_catalog: meteringCatalog,
    budget_policies: budgetPolicies,
    qos_policies: qosPolicies,
    qos_runtime_config: qosRuntimeConfig,
    extensions_runtime: extensionsRuntime,
    data_catalog: dataCatalog,
    retention_policies: retentionPolicies,
    export_controls: exportControls,
    integrations: {
      connectors,
      connector_versions: connectorVersions,
      connector_configs: connectorConfigs,
      webhooks,
      event_subscriptions: eventSubscriptions,
      secrets_vault_refs: secretsVaultRefs
    },
    sre: {
      slo_definitions: sloDefinitions,
      slo_versions: sloVersions,
      sli_sources: sliSources,
      error_budget_policies: errorBudgetPolicies,
      canary_policies: canaryPolicies
    },
    ops: {
      runbooks,
      runbook_versions: runbookVersions,
      mitigation_policies: mitigationPolicies,
      mitigation_versions: mitigationVersions,
      incident_severities: incidentSeverities
    }
  };

  const checksums = {
    manifest: "",
    routes: sha256(stableStringify(routeCatalog)),
    nav: sha256(stableStringify(navManifest)),
    themes: sha256(stableStringify(themeManifest)),
    guards: sha256(stableStringify(guards)),
    render_graph: sha256(stableStringify(renderGraph)),
    datasource_contracts: sha256(stableStringify(datasourceContracts)),
    workflow_dags: sha256(stableStringify(workflowDags))
  };

  manifest.checksums = checksums;
  const manifestJson = stableStringify({ ...manifest, signature: "" });
  manifest.checksums.manifest = sha256(manifestJson);

  const manifestPayload = stableStringify({ ...manifest, signature: "" });
  const privateKey = readKey(privateKeyPath);
  const signature = signPayload(manifestPayload, privateKey);
  manifest.signature = signature;

  writeJson(`${outDir}/platform_manifest.${releaseId}.json`, manifest);
  writeText(`${outDir}/platform_manifest.${releaseId}.sig`, signature);
  writeJson(`${outDir}/checksums.${releaseId}.json`, checksums);
  writeJson(`${outDir}/compat_matrix.${releaseId}.json`, manifest.compat_matrix);

  validateOrThrow("checksums.v1", checksums, "checksums");
  validateOrThrow("compat_matrix.v1", manifest.compat_matrix, "compat_matrix");
  validateOrThrow("platform_manifest.v1", manifest, "platform_manifest");

  return manifest;
}
