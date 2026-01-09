import type { ComponentType } from "react";

export type ComponentId = string;

export type RegisteredComponent = {
  id: ComponentId;
  component: ComponentType<any>;
  meta?: {
    displayName?: string;
    description?: string;
    tags?: string[];
  };
};

export type RegistrySnapshot = {
  readonly ids: readonly ComponentId[];
  readonly get: (id: ComponentId) => RegisteredComponent | undefined;
};
