export function getApiBase(): string {
  try {
    const v = (import.meta as any)?.env?.VITE_API_BASE;
    if (v && String(v).trim()) return String(v).trim();
  } catch {}

  try {
    if (typeof window !== "undefined") {
      const host = window.location.hostname;
      const isLocal = host === "localhost" || host === "127.0.0.1";
      if (isLocal) return "http://localhost:3001";
      return window.location.origin;
    }
  } catch {}

  return "http://localhost:3001";
}
