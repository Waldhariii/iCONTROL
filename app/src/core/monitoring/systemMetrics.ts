export type MetricValue = number | string | boolean;

function record(name: string, value: MetricValue) {
  // MVI instrumentation — zero side effects
  console.debug("[metric]", name, value);
}

function counter(name: string, delta = 1) {
  record(name, delta);
}

function gauge(name: string, value: number) {
  record(name, value);
}

function timer(name: string, ms: number) {
  record(name, `${ms}ms`);
}

export const systemMetrics = {
  record,
  counter,
  gauge,
  timer,
};
