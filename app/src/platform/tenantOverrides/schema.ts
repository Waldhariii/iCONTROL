/**
 * Zero-deps schema spec (browser-safe).
 * We intentionally avoid zod here to keep Vite builds deterministic and dependency-light.
 *
 * Shape (v1):
 * {
 *   schemaVersion: 1,
 *   updatedAt: string,
 *   updatedBy?: string,
 *   theme?: { APP?: Record<string,string>, CP?: Record<string,string> },
 *   features?: Record<string, boolean>
 * }
 */
export const TENANT_OVERRIDES_SCHEMA_VERSION = 1 as const;
