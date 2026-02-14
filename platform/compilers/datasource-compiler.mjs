import { readJson, writeJson } from "./utils.mjs";
import { validateOrThrow } from "../../core/contracts/schema/validate.mjs";

export function compileDatasources({ ssotDir, outDir, releaseId }) {
  const dataContracts = readJson(`${ssotDir}/data/data_contracts.json`);
  const datasources = readJson(`${ssotDir}/data/datasource_catalog.json`);
  const queries = readJson(`${ssotDir}/data/query_catalog.json`);
  const queryBudgets = readJson(`${ssotDir}/data/query_budgets.json`);
  const cachePolicies = readJson(`${ssotDir}/data/cache_policies.json`);
  validateOrThrow("array_of_objects.v1", dataContracts, "data_contracts");
  validateOrThrow("array_of_objects.v1", datasources, "datasource_catalog");
  validateOrThrow("array_of_objects.v1", queries, "query_catalog");
  validateOrThrow("array_of_objects.v1", queryBudgets, "query_budgets");
  validateOrThrow("array_of_objects.v1", cachePolicies, "cache_policies");

  const contracts = {
    release_id: releaseId,
    data_contracts: dataContracts,
    datasources,
    queries,
    query_budgets: queryBudgets,
    cache_policies: cachePolicies
  };

  writeJson(`${outDir}/datasource_contracts.${releaseId}.json`, contracts);
  validateOrThrow("datasource_contracts.v1", contracts, "datasource_contracts");
  return contracts;
}
