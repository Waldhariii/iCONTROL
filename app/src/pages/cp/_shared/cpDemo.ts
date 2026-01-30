export function isCpDemoEnabled(): boolean {
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get("demo") === "1") return true;
  } catch {}
  return !!import.meta.env.DEV;
}

export function demoSeries(length = 12, base = 40, variance = 30): number[] {
  const data: number[] = [];
  let seed = base;
  for (let i = 0; i < length; i += 1) {
    const delta = ((i * 17) % variance) - variance / 2;
    seed = Math.max(0, seed + delta * 0.35);
    data.push(Math.round(seed));
  }
  return data;
}

export function demoDate(label = "2024-10-15T12:00:00Z"): string {
  return label;
}
