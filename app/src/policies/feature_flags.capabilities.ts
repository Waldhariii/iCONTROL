/**
 * Capability → forced feature flags OFF
 * Contract: minimal, explicit, easy to extend without refactor.
 *
 * Convention: capabilities are strings from Version Policy:
 *  - e.g. "cap.disable.developer" forces developer-related flags OFF
 */
export const CAPABILITY_FORCED_OFF: Record<string, readonly string[]> = {
  // Examples (start tiny; extend via Management later)
  "cap.disable.developer": ["ui.developer", "ui.developer.entitlements"],
  "cap.disable.settings": ["ui.settings", "ui.settings.branding"],
  "cap.disable.users": ["ui.users"],
  "cap.disable.dossiers": ["ui.dossiers"],
} as const;

export function forcedOffFlagsFromCapabilities(capabilities: readonly string[] | undefined): string[] {
  const out: string[] = [];
  for (const cap of capabilities || []) {
    const list = CAPABILITY_FORCED_OFF[String(cap)];
    if (Array.isArray(list)) out.push(...list.map(String));
  }
  // de-dup stable
  return Array.from(new Set(out)).sort();
}
