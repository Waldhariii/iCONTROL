export function parseSemver(v) {
  const [maj, min, pat] = String(v || "0.0.0").split(".").map((n) => Number(n));
  return { maj: maj || 0, min: min || 0, pat: pat || 0 };
}

export function compareSemver(a, b) {
  const x = parseSemver(a);
  const y = parseSemver(b);
  if (x.maj !== y.maj) return x.maj - y.maj;
  if (x.min !== y.min) return x.min - y.min;
  return x.pat - y.pat;
}

export function isValidSemver(v) {
  return /^\d+\.\d+\.\d+$/.test(String(v || ""));
}

export function isMajorBump(from, to) {
  return parseSemver(from).maj < parseSemver(to).maj;
}
