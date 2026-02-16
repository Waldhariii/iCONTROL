/**
 * Phase AF: Register all allowlisted adapters. Import once before using registry.
 */
import { register } from "./registry.mjs";
import { storageWrite, storageRead } from "./adapters/storage.fs.mjs";
import pdfLocal from "./adapters/pdf.local.mjs";
import ocrStub from "./adapters/ocr.stub.mjs";
import accountingStub from "./adapters/accounting.stub.mjs";
import notifyStub from "./adapters/notify.stub.mjs";

let bootstrapped = false;

export function bootstrapAdapters() {
  if (bootstrapped) return;
  register("storage.write", storageWrite);
  register("storage.read", storageRead);
  register("pdf.generate", pdfLocal);
  register("ocr.ingest", ocrStub);
  register("accounting.sync", accountingStub);
  register("notify.send", notifyStub);
  bootstrapped = true;
}
