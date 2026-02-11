// @ts-nocheck
import { webStorage } from "../../../../../../apps/control-plane/src/core/storage/webStorage";

export function readStorage(key: string): string | null {
  try {
    return webStorage.get(key);
  } catch {
    return null;
  }
}
