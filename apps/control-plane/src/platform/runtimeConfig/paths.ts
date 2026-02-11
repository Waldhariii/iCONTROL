export function resolveRuntimeConfigPath(): string | null {
  // Priority order (explicit > conventional):
  // 1) ICONTROL_RUNTIME_CONFIG_PATH
  // 2) repo-root/.icontrol_subscriptions.json (runtime-only)
  // 3) none => fallback to example or default
  const envPath = (globalThis as any)?.process?.env?.ICONTROL_RUNTIME_CONFIG_PATH;
  if (typeof envPath === "string" && envPath.trim().length > 0) return envPath.trim();
  return ".icontrol_subscriptions.json";
}

export function resolveExampleConfigPath(): string {
  return ".icontrol_subscriptions.example.json";
}
