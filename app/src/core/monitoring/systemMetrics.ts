type MetricValue = number;

function record(name: string, value: MetricValue) {
  // MVI instrumentation — no side effects
  console.debug("[metric]", name, value);
}

export const systemMetrics = {
  record,
};
