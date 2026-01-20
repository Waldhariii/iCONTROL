import { makeDefaultRuntimeConfig } from "../contracts/runtimeConfig";

let _runtimeConfig = makeDefaultRuntimeConfig();

export function setRuntimeConfig(next: typeof _runtimeConfig): void {
  _runtimeConfig = next;
}

export function getRuntimeConfigSnapshot(): typeof _runtimeConfig {
  return _runtimeConfig;
}
