// Audit payload redaction (PII/Secrets guardrail)
// Enterprise objective: prevent leakage of secrets into observability streams.
//
// - Denylist keys (case-insensitive match)
// - Heuristic detection on values (bearer tokens, jwt-like, api keys)
// - Depth + size caps to protect performance

const SENSITIVE_KEYS = [
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "api_key",
  "apikey",
  "token",
  "access_token",
  "refresh_token",
  "id_token",
  "secret",
  "password",
  "pass",
  "session",
  "sessionid",
  "sid",
  "csrf",
  "xsrf",
  "private_key",
  "client_secret",
];

const MAX_DEPTH = 4;
const MAX_STRING = 256;

function isJwtLike(v: string): boolean {
  // very lightweight heuristic: three dot-separated base64url-ish parts
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(v);
}

function looksSensitiveValue(v: any): boolean {
  if (typeof v !== "string") return false;
  const s = v.trim();
  if (!s) return false;
  if (s.toLowerCase().startsWith("bearer ")) return true;
  if (isJwtLike(s)) return true;
  // common high-entropy API key-ish patterns
  if (/^sk-[A-Za-z0-9]{16,}$/.test(s)) return true;
  if (/^[A-Za-z0-9_\-]{32,}$/.test(s)) return true;
  return false;
}

function clipString(v: string): string {
  if (v.length <= MAX_STRING) return v;
  return v.slice(0, MAX_STRING) + "…";
}

function redactAny(value: any, depth: number): any {
  if (depth > MAX_DEPTH) return "[REDACTED_DEPTH]";
  if (value == null) return value;

  if (typeof value === "string") {
    const s = clipString(value);
    return looksSensitiveValue(s) ? "[REDACTED]" : s;
  }

  if (typeof value === "number" || typeof value === "boolean") return value;

  if (Array.isArray(value)) {
    return value.slice(0, 50).map((v) => redactAny(v, depth + 1));
  }

  if (typeof value === "object") {
    const out: any = {};
    const entries = Object.entries(value).slice(0, 100);
    for (const [k, v] of entries) {
      const key = String(k);
      const keyLc = key.toLowerCase();
      const isSensitiveKey = SENSITIVE_KEYS.some((sk) => sk === keyLc);
      if (isSensitiveKey) {
        out[key] = "[REDACTED]";
      } else {
        out[key] = redactAny(v, depth + 1);
      }
    }
    return out;
  }

  // functions/symbols/bigints -> stringify minimal
  try {
    return String(value);
  } catch {
    return "[UNSERIALIZABLE]";
  }
}

export function redactAuditPayload(payload: any): any {
  try {
    return redactAny(payload, 0);
  } catch {
    return { ts: payload?.ts, module: payload?.module, scope: payload?.scope, source: payload?.source, redaction_failed: true };
  }
}
