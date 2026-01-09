/**
 * Registry is framework-agnostic in iCONTROL core.
 * We intentionally avoid React/JSX types here to keep the core portable and low-risk.
 */
export type ComponentId = string;

export type ComponentMeta = {
  displayName?: string;
  description?: string;
  version?: number;
};

export type RegisteredComponent = {
  id: ComponentId;
  /**
   * 'component' is an opaque handle. In DOM apps it can be a descriptor object,
   * and later it can become a React component or other renderer contract.
   */
  component: unknown;
  meta?: ComponentMeta;
};
