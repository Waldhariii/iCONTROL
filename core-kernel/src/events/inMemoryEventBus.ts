import type { EventBus, EventEnvelope, EventHandler, EventName } from "./eventBus";

export function createInMemoryEventBus(): EventBus {
  const handlers = new Map<EventName, Set<EventHandler>>();
  return {
    publish(evt: EventEnvelope) {
      const set = handlers.get(evt.name);
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
