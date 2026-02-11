import type { EventEnvelope } from "./types";

export type EventHandler<T = EventEnvelope> = (evt: T) => void | Promise<void>;
export type EventName = string;

export function createInMemoryEventBus() {
  const handlers = new Map<EventName, Set<EventHandler>>();
  return {
    publish(evt: EventEnvelope & { name?: string }) {
      const key = evt.name || evt.type;
      const set = handlers.get(key);
      if (!set) return;
      for (const h of set) void Promise.resolve(h(evt));
    },
    subscribe(name: EventName, handler: EventHandler) {
      const set = handlers.get(name) ?? new Set<EventHandler>();
      set.add(handler);
      handlers.set(name, set);
      return () => {
        const s = handlers.get(name);
        if (!s) return;
        s.delete(handler);
      };
    },
  };
}
