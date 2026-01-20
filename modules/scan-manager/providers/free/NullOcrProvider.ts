/**
 * ICONTROL_SCAN_OCR_FREE_V1
 * NullOcrProvider - FREE fallback (pas d'OCR)
 */

import type { OcrProvider, OcrResult } from "../interfaces";
import type { Page } from "../../domain/types";

export class NullOcrProvider implements OcrProvider {
  isAvailable(): boolean {
    return false; // Toujours désactivé en FREE
  }

  async runDocument(documentId: string, pages: Page[]): Promise<OcrResult> {
    // FREE: retourne vide, OCR non disponible
    return {
      textRef: "",
      perPageTextRefs: pages.map(() => ""),
      confidence: 0,
    };
  }
}
