/**
 * ICONTROL_VERSION_GATE_V1 — Stub pour compatibilité des versions.
 * À compléter: vérifier version app vs politique (version_policy, backend) et afficher
 * "Update Required" dans mount si blocage. Pour l’instant: allow.
 */
export async function applyVersionGate(_mount: HTMLElement): Promise<{ allowed: boolean }> {
  return { allowed: true };
}
