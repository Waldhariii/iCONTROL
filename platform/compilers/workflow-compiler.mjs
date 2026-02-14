import { readJson, writeJson } from "./utils.mjs";
import { validateOrThrow } from "../../core/contracts/schema/validate.mjs";

export function compileWorkflows({ ssotDir, outDir, releaseId }) {
  const defs = readJson(`${ssotDir}/studio/workflows/workflow_definitions.json`);
  const triggers = readJson(`${ssotDir}/studio/workflows/workflow_triggers.json`);
  const actions = readJson(`${ssotDir}/studio/workflows/workflow_actions.json`);
  const variables = readJson(`${ssotDir}/studio/workflows/workflow_variables.json`);
  const retryPolicies = readJson(`${ssotDir}/studio/workflows/retry_policies.json`);
  const compensation = readJson(`${ssotDir}/studio/workflows/compensation_rules.json`);
  validateOrThrow("array_of_objects.v1", defs, "workflow_definitions");
  validateOrThrow("array_of_objects.v1", triggers, "workflow_triggers");
  validateOrThrow("array_of_objects.v1", actions, "workflow_actions");
  validateOrThrow("array_of_objects.v1", variables, "workflow_variables");
  validateOrThrow("array_of_objects.v1", retryPolicies, "retry_policies");
  validateOrThrow("array_of_objects.v1", compensation, "compensation_rules");

  const dags = {
    release_id: releaseId,
    workflows: defs,
    triggers,
    actions,
    variables,
    retry_policies: retryPolicies,
    compensation_rules: compensation
  };

  writeJson(`${outDir}/workflow_dags.${releaseId}.json`, dags);
  validateOrThrow("workflow_dags.v1", dags, "workflow_dags");
  return dags;
}
