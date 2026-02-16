/**
 * Phase AK: Hermetic server spawn for CI — PORT=0, parse __IC_BOUND__, no hardcoded port.
 */
import { spawn } from "child_process";

const BOUND_PATTERN = /__IC_BOUND__=(\{.*\})/;

/**
 * Parse __IC_BOUND__ line from stdout.
 * @param {string} line
 * @returns {{ host?: string, port?: number } | null}
 */
export function parseBoundLine(line) {
  const m = String(line || "").match(BOUND_PATTERN);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

/**
 * Spawn backend API server with PORT=0. Stdout must be piped to detect __IC_BOUND__.
 * @param {{ cwd?: string, env?: Record<string, string>, args?: string[] }} opts
 * @returns {{ process: import("child_process").ChildProcess, stdoutChunks: Buffer[] }}
 */
export function spawnServer(opts = {}) {
  const cwd = opts.cwd ?? process.cwd();
  const env = {
    ...process.env,
    CI: "true",
    HOST: "127.0.0.1",
    PORT: "0",
    ...opts.env
  };
  const args = opts.args ?? ["apps/backend-api/server.mjs"];
  const proc = spawn("node", args, {
    stdio: ["ignore", "pipe", "inherit"],
    cwd,
    env
  });
  const stdoutChunks = [];
  proc.stdout?.on("data", (chunk) => stdoutChunks.push(chunk));
  return { process: proc, stdoutChunks };
}

/**
 * Wait for __IC_BOUND__ on stdout, with timeout.
 * @param {{ stdoutChunks: Buffer[], timeoutMs?: number }} opts
 * @returns {Promise<{ host: string, port: number }>}
 */
export function waitForBound(opts) {
  const { stdoutChunks, timeoutMs = 15000 } = opts;
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    function check() {
      const out = Buffer.concat(stdoutChunks).toString("utf-8");
      for (const line of out.split(/\r?\n/)) {
        const bound = parseBoundLine(line);
        if (bound && bound.port != null) {
          resolve({
            host: bound.host ?? "127.0.0.1",
            port: Number(bound.port)
          });
          return;
        }
      }
      if (Date.now() >= deadline) {
        reject(new Error("waitForBound timeout: __IC_BOUND__ not seen"));
        return;
      }
      setTimeout(check, 50);
    }
    check();
  });
}

/**
 * Build base URL from bound { host, port }.
 * @param {{ host: string, port: number }} bound
 * @returns {string}
 */
export function getBaseUrl(bound) {
  const host = bound.host ?? "127.0.0.1";
  const port = bound.port ?? 0;
  return `http://${host}:${port}`;
}

/**
 * Kill server process (SIGTERM).
 * @param {import("child_process").ChildProcess} proc
 */
export function killServer(proc) {
  if (proc && !proc.killed) {
    try {
      proc.kill("SIGTERM");
    } catch {
      // ignore
    }
  }
}
