import fs from "fs";
import path from "path";
import type { LoadedRuntimeConfig, RuntimeMode } from "./types";
import { resolveRuntimeConfigPath, resolveExampleConfigPath } from "./paths";
import { sha256 } from "./hash";
import { validateRuntimeConfig } from "./validateRuntimeConfig";

function modeFromEnv(): RuntimeMode {
  const env = (globalThis as any)?.process?.env;
  const nodeEnv = (env?.NODE_ENV || "").toLowerCase();
  const vitest = !!env?.VITEST || !!env?.VITEST_WORKER_ID;
  if (vitest) return "test";
  if (nodeEnv === "production" || env?.ICONTROL_PROD === "1") return "prod";
  if (nodeEnv === "test") return "test";
  return "dev";
}

function readJsonIfExists(absPath: string): { ok: boolean; text?: string; err?: string } {
  try {
    if (!fs.existsSync(absPath)) return { ok: false };
    const text = fs.readFileSync(absPath, "utf8");
    return { ok: true, text };
  } catch (e: any) {
    return { ok: false, err: String(e?.message || e) };
  }
}

export function loadRuntimeConfig(cwd = process.cwd()): LoadedRuntimeConfig {
  const mode = modeFromEnv();
  const runtimeRel = resolveRuntimeConfigPath();
  const exampleRel = resolveExampleConfigPath();

  const runtimeAbs = runtimeRel ? path.resolve(cwd, runtimeRel) : null;
  const exampleAbs = path.resolve(cwd, exampleRel);

  const loadedAt = new Date().toISOString();

  // 1) runtime file (preferred)
  if (runtimeAbs) {
    const r = readJsonIfExists(runtimeAbs);
    if (r.ok && r.text != null) {
      const raw = JSON.parse(r.text);
      const metaBase = {
        source: "runtime" as const,
        filePath: runtimeAbs,
        sha256: sha256(r.text),
        loadedAt,
        mode,
      };
      return validateRuntimeConfig(raw, metaBase);
    }
    // If file exists but unreadable => fail in prod
    if (r.err) {
      const msg = `ERR_RUNTIME_CONFIG_READ: ${r.err}`;
      if (mode === "prod") throw new Error(msg);
    }
  }

  // 2) example file fallback (dev/test friendly)
  const ex = readJsonIfExists(exampleAbs);
  if (ex.ok && ex.text != null) {
    const raw = JSON.parse(ex.text);
    const metaBase = {
      source: "example" as const,
      filePath: exampleAbs,
      sha256: sha256(ex.text),
      loadedAt,
      mode,
    };
    return validateRuntimeConfig(raw, metaBase);
  }

  // 3) hard default
  const metaBase = {
    source: "default" as const,
    filePath: undefined,
    sha256: undefined,
    loadedAt,
    mode,
  };
  return validateRuntimeConfig({}, metaBase);
}
