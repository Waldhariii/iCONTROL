import type { RuntimeConfigV1 } from "./runtimeConfig";

export interface RuntimeConfigPort {
  getRuntimeConfig(): Promise<RuntimeConfigV1>;
}
