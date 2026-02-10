export type DemoPoint = { ts: string; value: number };

export const demoSeriesStatic: DemoPoint[] = [
  { ts: "T-4", value: 12 },
  { ts: "T-3", value: 18 },
  { ts: "T-2", value: 15 },
  { ts: "T-1", value: 21 },
  { ts: "T-0", value: 19 },
];

export function demoSeries(points = 10, base = 50, variance = 15): DemoPoint[] {
  const out: DemoPoint[] = [];
  for (let i = points - 1; i >= 0; i -= 1) {
    const delta = (Math.sin((points - i) * 0.6) + Math.random() - 0.5) * variance;
    out.push({ ts: `T-${i}`, value: Math.max(0, Math.round(base + delta)) });
  }
  return out;
}
