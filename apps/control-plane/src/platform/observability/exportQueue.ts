/**
 * O3 Export queue — in-memory, max size, backpressure drop oldest.
 * Never throw. Caller must increment observability.export.dropped when enqueue returns false.
 */
import type { ExportEvent } from "./exportTypes";

const MAX_SIZE = 500;
const queue: ExportEvent[] = [];

/** Enqueue event. Drops oldest if full. Returns true if enqueued, false if dropped (caller increments observability.export.dropped). */
export function enqueue(event: ExportEvent): boolean {
  try {
    if (queue.length >= MAX_SIZE) {
      queue.shift();
      queue.push(event);
      return false;
    }
    queue.push(event);
    return true;
  } catch {
    return false;
  }
}

/** Dequeue up to maxItems. Returns oldest first. */
export function dequeueBatch(maxItems: number): ExportEvent[] {
  try {
    const n = Math.min(maxItems, queue.length);
    if (n <= 0) return [];
    return queue.splice(0, n);
  } catch {
    return [];
  }
}

export function size(): number {
  try {
    return queue.length;
  } catch {
    return 0;
  }
}

export function clear(): void {
  try {
    queue.length = 0;
  } catch {
    // silent
  }
}
