/**
 * Minimal guardrail set. Expand later with allowlist strategy.
 * We keep it tiny to avoid false positives / maintenance overhead.
 */
const BLOCK_PATTERNS: RegExp[] = [
  /<\s*script\b/i,
  /\bon\w+\s*=/i,          // onclick=, onload=, etc.
  /\bjavascript\s*:/i,
  /\bdata\s*:\s*text\/html/i,
];

export function isHtmlSafe(candidate: string): { ok: true } | { ok: false; detail: string } {
  for (const rx of BLOCK_PATTERNS) {
    if (rx.test(candidate)) return { ok: false, detail: `blocked_pattern=${String(rx)}` };
  }
  return { ok: true };
}
