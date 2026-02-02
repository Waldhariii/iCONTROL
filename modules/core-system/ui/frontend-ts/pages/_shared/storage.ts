import { webStorage } from "../../../../../../shared/storage/webStorage";

export function readStorage(key: string): string | null {
  try {
    return webStorage.get(key);
  } catch {
    return null;
  }
}
