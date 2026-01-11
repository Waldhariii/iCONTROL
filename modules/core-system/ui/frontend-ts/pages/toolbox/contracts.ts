export type ToolboxCtx = {
  safeMode: boolean;
  role: string;
  username: string;
};

export type ToolboxSection = {
  id: string;
  title: string;
  render: (root: HTMLElement, ctx: ToolboxCtx) => void;
};
