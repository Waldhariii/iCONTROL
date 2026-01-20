/**
 * ICONTROL_SCAN_STORAGE_FREE_V1
 * StorageProvider FREE - Stockage local (localStorage + IndexedDB pour fichiers)
 */

import type { StorageProvider } from "../interfaces";

export class FreeStorageProvider implements StorageProvider {
  private readonly prefix = "scan_storage_";

  async putObject(ref: string, bytes: Uint8Array | Blob, contentType: string): Promise<string> {
    try {
      const key = `${this.prefix}${ref}`;
      
      // Pour les petits fichiers, utiliser localStorage
      if (bytes instanceof Blob) {
        const arrayBuffer = await bytes.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        
        if (uint8Array.length < 5 * 1024 * 1024) { // < 5MB
          const base64 = this.uint8ArrayToBase64(uint8Array);
          localStorage.setItem(key, base64);
          localStorage.setItem(`${key}_meta`, JSON.stringify({ contentType, size: uint8Array.length }));
          return ref;
        }
      }
      
      // Pour les gros fichiers, utiliser IndexedDB (si disponible)
      if (typeof window !== "undefined" && window.indexedDB) {
        await this.storeInIndexedDB(key, bytes, contentType);
        return ref;
      }
      
      // Fallback: stocker la référence dans localStorage même si gros
      const base64 = bytes instanceof Blob 
        ? await this.blobToBase64(bytes)
        : this.uint8ArrayToBase64(bytes);
      localStorage.setItem(key, base64);
      localStorage.setItem(`${key}_meta`, JSON.stringify({ contentType, size: bytes instanceof Blob ? bytes.size : bytes.length }));
      
      return ref;
    } catch (e) {
      throw new Error(`ERR_SCAN_STORAGE_WRITE: Failed to store object ${ref}: ${e}`);
    }
  }

  async getObject(ref: string): Promise<Blob> {
    try {
      const key = `${this.prefix}${ref}`;
      const base64 = localStorage.getItem(key);
      
      if (!base64) {
        // Essayer IndexedDB
        if (typeof window !== "undefined" && window.indexedDB) {
          const stored = await this.getFromIndexedDB(key);
          if (stored) return stored;
        }
        throw new Error(`Object not found: ${ref}`);
      }
      
      const metaStr = localStorage.getItem(`${key}_meta`);
      const meta = metaStr ? JSON.parse(metaStr) : { contentType: "application/octet-stream" };
      
      const bytes = this.base64ToUint8Array(base64);
      return new Blob([bytes], { type: meta.contentType });
    } catch (e) {
      throw new Error(`Failed to get object ${ref}: ${e}`);
    }
  }

  async deleteObject(ref: string): Promise<void> {
    try {
      const key = `${this.prefix}${ref}`;
      localStorage.removeItem(key);
      localStorage.removeItem(`${key}_meta`);
      
      if (typeof window !== "undefined" && window.indexedDB) {
        await this.deleteFromIndexedDB(key);
      }
    } catch (e) {
      console.warn(`Failed to delete object ${ref}: ${e}`);
    }
  }

  async exists(ref: string): Promise<boolean> {
    const key = `${this.prefix}${ref}`;
    return localStorage.getItem(key) !== null || 
           (typeof window !== "undefined" && window.indexedDB ? await this.existsInIndexedDB(key) : false);
  }

  // Helpers
  private uint8ArrayToBase64(bytes: Uint8Array): string {
    let binary = "";
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToUint8Array(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    return this.uint8ArrayToBase64(uint8Array);
  }

  private async storeInIndexedDB(key: string, data: Uint8Array | Blob, contentType: string): Promise<void> {
    // TODO: Implémenter IndexedDB si nécessaire
    // Pour l'instant, fallback sur localStorage
  }

  private async getFromIndexedDB(key: string): Promise<Blob | null> {
    // TODO: Implémenter IndexedDB si nécessaire
    return null;
  }

  private async deleteFromIndexedDB(key: string): Promise<void> {
    // TODO: Implémenter IndexedDB si nécessaire
  }

  private async existsInIndexedDB(key: string): Promise<boolean> {
    // TODO: Implémenter IndexedDB si nécessaire
    return false;
  }
}
