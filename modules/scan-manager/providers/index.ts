/**
 * ICONTROL_SCAN_PROVIDERS_INDEX_V1
 * Export des providers + factory pour sélectionner FREE vs PREMIUM
 */

export * from "./interfaces";
export * from "./free/StorageProvider.free";
export * from "./free/NullOcrProvider";
export * from "./free/StaticRulesRoutingProvider";

import type { StorageProvider, OcrProvider, RoutingProvider } from "./interfaces";
import { FreeStorageProvider } from "./free/StorageProvider.free";
import { NullOcrProvider } from "./free/NullOcrProvider";
import { StaticRulesRoutingProvider } from "./free/StaticRulesRoutingProvider";
import type { ScanCapability } from "../domain/types";

/**
 * Factory pour obtenir les providers selon les capabilities disponibles
 */
export function createProviders(capabilities: Set<ScanCapability>): {
  storage: StorageProvider;
  ocr: OcrProvider;
  routing: RoutingProvider;
} {
  return {
    storage: new FreeStorageProvider(),
    ocr: capabilities.has("scan.ocr.cloud") 
      ? null as any // TODO: CloudOcrProvider when premium module available
      : new NullOcrProvider(),
    routing: capabilities.has("scan.route.ai")
      ? null as any // TODO: AiRoutingProvider when premium module available
      : new StaticRulesRoutingProvider(),
  };
}
