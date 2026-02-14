import { readJson, writeJson } from "./utils.mjs";
import { validateOrThrow } from "../../core/contracts/schema/validate.mjs";

export function compilePermissions({ ssotDir, outDir, releaseId }) {
  const roles = readJson(`${ssotDir}/governance/roles.json`);
  const permissions = readJson(`${ssotDir}/governance/permissions.json`);
  const permissionSets = readJson(`${ssotDir}/governance/permission_sets.json`);
  const policies = readJson(`${ssotDir}/governance/policies.json`);
  const bindings = readJson(`${ssotDir}/governance/policy_bindings.json`);
  validateOrThrow("array_of_objects.v1", roles, "roles");
  validateOrThrow("array_of_objects.v1", permissions, "permissions");
  validateOrThrow("array_of_objects.v1", permissionSets, "permission_sets");
  validateOrThrow("array_of_objects.v1", policies, "policies");
  validateOrThrow("array_of_objects.v1", bindings, "policy_bindings");

  const guardPacks = roles.map((role) => {
    const boundPolicies = bindings.filter((b) => b.role_id === role.id).map((b) => b.policy_id);
    return {
      guard_pack_id: `guard:${role.id}`,
      role_id: role.id,
      permission_sets: permissionSets.filter((ps) => ps.role_id === role.id),
      policies: policies.filter((p) => boundPolicies.includes(p.id)),
      permissions: permissions.filter((p) => p.role_id === role.id)
    };
  });

  const guards = { release_id: releaseId, guard_packs: guardPacks };
  writeJson(`${outDir}/guards.${releaseId}.json`, guards);
  validateOrThrow("guards.v1", guards, "guards");
  return guards;
}
