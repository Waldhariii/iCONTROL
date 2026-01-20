export type SafeModeValue = "OFF" | "COMPAT" | "STRICT";

export function getSafeMode(): SafeModeValue {
  const v = (globalThis as any).ICONTROL_SAFE_MODE;
  if (v === "STRICT") return "STRICT";
  if (v === "COMPAT") return "COMPAT";
  return "OFF";
}

export function mapSafeMode(value: string): SafeModeValue {
  if (value === "STRICT") return "STRICT";
  if (value === "COMPAT") return "COMPAT";
  return "OFF";
}

export function safeRender(root: HTMLElement, run: (() => void) | string): void {
  try {
    if (typeof run === "function") {
      run();
      return;
    }
    root.innerHTML = run;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    root.innerHTML = `<div style="opacity:.8;max-width:780px;margin:24px auto;">Render error: ${msg}</div>`;
  }
}

export function escapeHtml(value: string): string {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function fetchJsonSafe<T = unknown>(
  url: string,
  init: RequestInit = {}
): Promise<{ ok: boolean; status: number; data?: T; error?: string }> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        accept: "application/json",
        ...(init.headers || {})
      }
    });
    if (!res.ok) {
      return { ok: false, status: res.status, error: `HTTP ${res.status}` };
    }
    const data = (await res.json()) as T;
    return { ok: true, status: res.status, data };
  } catch (error) {
    return { ok: false, status: 0, error: String(error) };
  }
}
