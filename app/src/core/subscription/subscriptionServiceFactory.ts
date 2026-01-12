/**
 * SubscriptionService Factory (SSOT).
 * Enterprise-grade: dual runtime separation (Node vs Browser).
 * - Browser: InMemory store (no node builtin fs/path in bundle)
 * - Node: File-backed store (local dev / tooling)
 *
 * Marker: ICONTROL_SSOT_FACTORY_DUAL_RUNTIME_V1
 */

import type { SubscriptionService } from "../../../../modules/core-system/subscription/SubscriptionService";
import { SubscriptionService as SubscriptionServiceImpl } from "../../../../modules/core-system/subscription/SubscriptionService";
import { InMemorySubscriptionStore } from "../../../../modules/core-system/subscription/SubscriptionStore";
import { InMemoryAuditTrail } from "../../../../modules/core-system/subscription/AuditTrail";
import { FileSubscriptionStore as BrowserFileSubscriptionStore } from "../../../../modules/core-system/subscription/FileSubscriptionStore.browser";

// NOTE: FileSubscriptionStore is Node-only. We import it dynamically in Node to avoid Vite bundling.
type FileStoreCtor = new (...args: any[]) => any;

function isBrowserRuntime(): boolean {
  // Vite injects import.meta.env; window is safest signal.
  return typeof window !== "undefined";
}

let nodeFileStoreCtor: FileStoreCtor | null = null;

async function getNodeFileStoreCtor(): Promise<FileStoreCtor> {
  if (nodeFileStoreCtor) return nodeFileStoreCtor;
  // Dynamic import: prevents browser bundle from pulling node builtin fs/path.
  const nodeUrl = new URL("../../../../modules/core-system/subscription/FileSubscriptionStore.node", import.meta.url);
const mod = await import(/* @vite-ignore */ nodeUrl.href);
  nodeFileStoreCtor = mod.FileSubscriptionStore as unknown as FileStoreCtor;
  return nodeFileStoreCtor!;
}

let singletonInMemory: InMemorySubscriptionStore | null = null;

function getBrowserStore(): InMemorySubscriptionStore {
  if (!singletonInMemory) singletonInMemory = new InMemorySubscriptionStore();
  return singletonInMemory;
}

let nodeStoreInstance: any | null = null;

async function getNodeStore(): Promise<any> {
  if (nodeStoreInstance) return nodeStoreInstance;
  const Ctor = await getNodeFileStoreCtor();
  nodeStoreInstance = new Ctor();
  return nodeStoreInstance;
}

export async function getSubscriptionService(): Promise<SubscriptionService> {
  // ICONTROL_SSOT_FACTORY_DUAL_RUNTIME_V1
  const audit = new InMemoryAuditTrail();
  if (isBrowserRuntime()) {
    const store = getBrowserStore();
    return new SubscriptionServiceImpl({ store, audit });
  }
  const store = await getNodeStore();
  return new SubscriptionServiceImpl({ store, audit });
}

// Expose the backing store for write-model operations (registry) without importing node builtins in client.
export async function getSubscriptionStore() {
  // Local runtime detection: avoids coupling to private helpers and keeps bundling predictable.
  // Node: process.versions.node is defined. Browser: undefined.
  const isNode = typeof process !== "undefined" && !!(process.versions && process.versions.node);
  return isNode ? await getNodeStore() : getBrowserStore();
}

