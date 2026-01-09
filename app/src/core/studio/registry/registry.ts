import type { ComponentId, RegisteredComponent, RegistrySnapshot } from "./types";

export class ComponentRegistry {
  private readonly map = new Map<ComponentId, RegisteredComponent>();

  register(entry: RegisteredComponent): void {
    if (!entry.id || typeof entry.id !== "string") throw new Error("ComponentRegistry.register: invalid id");
    if (!entry.component) throw new Error(`ComponentRegistry.register: missing component for id=${entry.id}`);
    this.map.set(entry.id, entry);
  }

  bulkRegister(entries: RegisteredComponent[]): void {
    for (const e of entries) this.register(e);
  }

  get(id: ComponentId): RegisteredComponent | undefined {
    return this.map.get(id);
  }

  snapshot(): RegistrySnapshot {
    const ids = Array.from(this.map.keys()).sort();
    const get = (id: ComponentId) => this.map.get(id);
    return { ids, get };
  }
}
