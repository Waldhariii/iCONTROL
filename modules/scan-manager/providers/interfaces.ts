/**
 * ICONTROL_SCAN_PROVIDERS_V1
 * Interfaces pour les providers interchangeables
 * FREE = implémentation basique, PREMIUM = implémentation avancée
 */

import type { Document, Page, DocumentBatch, RoutingDecision, Classification, Destination } from "../domain/types";

/**
 * StorageProvider - Stockage des fichiers
 * FREE: LocalFS / S3-compatible (minIO)
 * PREMIUM: Cloud storage avec versioning
 */
export interface StorageProvider {
  putObject(ref: string, bytes: Uint8Array | Blob, contentType: string): Promise<string>;
  getObject(ref: string): Promise<Blob>;
  deleteObject(ref: string): Promise<void>;
  exists(ref: string): Promise<boolean>;
}

/**
 * IngestionProvider - Normalisation des uploads
 * FREE: validation simple + conversion PDF
 */
export interface IngestionProvider {
  normalizeUpload(file: File | Blob, metadata?: Record<string, any>): Promise<NormalizedUpload>;
  extractBasicMetadata(file: File | Blob): Promise<Record<string, any>>;
}

export interface NormalizedUpload {
  format: "PDF" | "IMAGE";
  pages: Blob[]; // un blob par page
  metadata: Record<string, any>;
}

/**
 * QualityProvider - Score de qualité
 * FREE: heuristiques simples (blur/rotation) locales
 * PREMIUM: analyse avancée + suggestions
 */
export interface QualityProvider {
  scorePage(image: Blob): Promise<QualityScore>;
  scoreDocument(pages: Page[]): Promise<number>; // score moyen
}

export interface QualityScore {
  blur: number; // 0-100
  skew: number; // degrees
  contrast: number; // 0-100
  warnings: string[];
  recommendation?: "GOOD" | "WARNING" | "RE_SCAN";
}

/**
 * OcrProvider - OCR
 * FREE: NullOcrProvider (retourne vide)
 * PREMIUM: CloudOcrProvider (multi-langues, extraction champs)
 */
export interface OcrProvider {
  runDocument(documentId: string, pages: Page[]): Promise<OcrResult>;
  isAvailable(): boolean;
}

export interface OcrResult {
  textRef: string; // reference to full text storage
  perPageTextRefs: string[]; // one per page
  confidence: number; // 0-100
  language?: string;
  fields?: Record<string, any>; // extracted fields (premium)
}

/**
 * ClassificationProvider - Classification de documents
 * FREE: NullClassifier ou règles basées sur nommage
 * PREMIUM: AiClassifier (OCR + ML)
 */
export interface ClassificationProvider {
  classify(documentId: string, ocrTextRef?: string, pages?: Page[]): Promise<ClassificationResult>;
  isAvailable(): boolean;
}

export interface ClassificationResult {
  type: string; // "invoice", "contract", "receipt", etc.
  confidence: number; // 0-100
  fields?: Record<string, any>; // extracted fields (vendor, amount, tax, etc.)
  suggestions?: string[]; // alternative types
}

/**
 * SplitProvider - Découpage en documents
 * FREE: OneBatchOneDocument (pas de split)
 * PREMIUM: SeparatorSplitProvider (page blanche, QR, barcode)
 */
export interface SplitProvider {
  split(batch: DocumentBatch): Promise<SplitResult>;
  isAvailable(): boolean;
}

export interface SplitResult {
  documents: SplitDocument[];
  separators: Separator[]; // détectés
}

export interface SplitDocument {
  pageRanges: number[][]; // [[0,2], [3,5]]
  metadata?: Record<string, any>;
}

export interface Separator {
  type: "BLANK_PAGE" | "QR_CODE" | "BARCODE" | "MANUAL";
  pageIndex: number;
  confidence: number;
}

/**
 * RoutingProvider - Décision de routage
 * FREE: StaticRulesRoutingProvider (source→destination, tags, regex)
 * PREMIUM: AiRoutingProvider (OCR + classification + historique)
 */
export interface RoutingProvider {
  decide(
    document: Document,
    hints: RoutingHints,
    policies: RoutingPolicy[]
  ): Promise<RoutingDecisionResult>;
  isAvailable(): boolean;
}

export interface RoutingHints {
  sourceType: string;
  sourceId?: string;
  tags: string[];
  metadata: Record<string, any>;
  classification?: ClassificationResult;
  ocrTextRef?: string;
}

export interface RoutingPolicy {
  ruleId: string;
  condition: string; // JSON path expression
  destinationId: string;
  priority: number;
  enabled: boolean;
}

export interface RoutingDecisionResult {
  destinationId?: string;
  confidence: number; // 0-100
  method: "MANUAL" | "STATIC_RULE" | "AI_ROUTE";
  reason?: string;
  requiresTriage: boolean; // si confidence < threshold ou policy bloque
}

/**
 * ExportProvider - Export vers destination
 * FREE: VFS export + download
 * PREMIUM: ConnectorExportProvider (Drive/OneDrive/SharePoint/ERP)
 */
export interface ExportProvider {
  export(document: Document, destination: Destination): Promise<ExportReceipt>;
  isAvailable(): boolean;
}

export interface ExportReceipt {
  success: boolean;
  exportRef?: string; // reference to exported document
  error?: string;
  exportedAt: string;
}
