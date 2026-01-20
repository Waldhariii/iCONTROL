/**
 * ICONTROL_SCAN_DOMAIN_V1
 * Types du domaine pour le système de scan
 * Socle 100% gratuit + modules premium optionnels
 */

export type SourceType = "MOBILE" | "FOLDER_WATCH" | "UPLOAD" | "DESKTOP_CONNECTOR" | "EMAIL";
export type BatchStatus = "RECEIVED" | "PROCESSING" | "TRIAGE" | "ROUTED" | "ARCHIVED" | "ERROR";
export type DocumentStatus = "CREATED" | "TRIAGE" | "ROUTED" | "ARCHIVED" | "ERROR";
export type TriageStatus = "OPEN" | "IN_PROGRESS" | "DONE" | "BLOCKED";
export type TriageReason = "LOW_CONFIDENCE" | "MISSING_DESTINATION" | "POLICY_BLOCK" | "OCR_FAILED" | "QUALITY_ISSUE";
export type DestinationType = "VFS_FOLDER" | "MODULE_RECORD" | "CONNECTOR_TARGET";

/**
 * DocumentBatch - Lot d'ingestion
 */
export interface DocumentBatch {
  batchId: string; // UUID
  tenantId: string;
  userId: string;
  sourceType: SourceType;
  sourceId?: string; // scannerId/deviceId
  createdAt: string; // ISO timestamp
  updatedAt: string;
  status: BatchStatus;
  files: BatchFile[];
  metadata: BatchMetadata;
}

export interface BatchFile {
  fileId: string;
  originalName: string;
  contentType: string;
  size: number;
  storageRef: string; // object storage reference
  sha256?: string; // dedup hash
}

export interface BatchMetadata {
  dpi?: number;
  duplex?: boolean;
  profile?: string;
  clientHints?: Record<string, any>;
}

/**
 * Document - Document logique après split
 */
export interface Document {
  documentId: string; // UUID
  batchId: string;
  tenantId: string;
  userId: string;
  pages: Page[];
  classification?: Classification;
  ocrTextRef?: string; // reference to OCR text storage
  routingDecision?: RoutingDecision;
  tags: string[];
  status: DocumentStatus;
  createdAt: string;
  updatedAt: string;
  version: number;
}

/**
 * Page
 */
export interface Page {
  pageId: string;
  documentId: string;
  imageRef: string; // object storage reference
  sha256: string; // dedup hash
  pageIndex: number;
  qualityScore?: QualityScore;
  ocrPageTextRef?: string; // reference to OCR text for this page
}

export interface QualityScore {
  blur: number; // 0-100
  skew: number; // degrees
  contrast: number; // 0-100
  warnings: string[];
}

/**
 * Classification (OPTIONAL - premium)
 */
export interface Classification {
  type: string; // "invoice", "contract", "receipt", etc.
  confidence: number; // 0-100
  fields?: Record<string, any>; // extracted fields (vendor, amount, tax, etc.)
}

/**
 * RoutingDecision
 */
export interface RoutingDecision {
  destinationId: string;
  confidence: number; // 0-100
  method: "MANUAL" | "STATIC_RULE" | "AI_ROUTE";
  decidedBy: string; // userId or "system"
  decidedAt: string;
}

/**
 * Destination
 */
export interface Destination {
  destinationId: string;
  tenantId: string;
  name: string;
  type: DestinationType;
  path?: string; // VFS path
  recordKey?: string; // Module record key
  connectorSpec?: ConnectorSpec;
  permissionsPolicyRef?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConnectorSpec {
  provider: "ONEDRIVE" | "GDRIVE" | "SHAREPOINT" | "QUICKBOOKS" | "XERO" | "ERP";
  config: Record<string, any>;
}

/**
 * TriageTask
 */
export interface TriageTask {
  taskId: string; // UUID
  tenantId: string;
  batchId?: string;
  documentId: string;
  status: TriageStatus;
  reason: TriageReason;
  assignedTo?: string; // userId
  priority: number; // 1-10
  sla?: string; // ISO timestamp
  createdAt: string;
  updatedAt: string;
}

/**
 * AuditEvent (obligatoire)
 */
export interface AuditEvent {
  eventId: string; // UUID
  tenantId: string;
  actorId: string;
  actionCode: string; // "CP_SCAN_RECEIVED", "CP_SCAN_ROUTED", etc.
  entityRef: string; // batchId or documentId
  payload: Record<string, any>;
  createdAt: string;
}

/**
 * Capabilities / Entitlements
 */
export type ScanCapability =
  // FREE
  | "scan.ingest.mobile"
  | "scan.ingest.upload"
  | "scan.ingest.folder_watch"
  | "scan.inbox.triage_manual"
  | "scan.route.static_rules"
  | "scan.store.vfs"
  | "scan.export.local_download"
  | "scan.audit.basic"
  // PREMIUM
  | "scan.ocr.cloud"
  | "scan.classify.ai"
  | "scan.route.ai"
  | "scan.split.auto"
  | "scan.connectors.onedrive"
  | "scan.connectors.gdrive"
  | "scan.connectors.sharepoint"
  | "scan.desktop_connector.twain_wia"
  | "scan.audit.compliance";

/**
 * Error Codes (aligné à iCONTROL)
 */
export const SCAN_ERROR_CODES = {
  ERR_SCAN_INGEST_INVALID_FORMAT: "ERR_SCAN_INGEST_INVALID_FORMAT",
  ERR_SCAN_STORAGE_WRITE: "ERR_SCAN_STORAGE_WRITE",
  ERR_SCAN_OCR_TIMEOUT: "ERR_SCAN_OCR_TIMEOUT",
  ERR_SCAN_POLICY_BLOCKED: "ERR_SCAN_POLICY_BLOCKED",
  WARN_SCAN_LOW_QUALITY: "WARN_SCAN_LOW_QUALITY",
  WARN_SCAN_LOW_CONFIDENCE_ROUTE: "WARN_SCAN_LOW_CONFIDENCE_ROUTE",
} as const;
