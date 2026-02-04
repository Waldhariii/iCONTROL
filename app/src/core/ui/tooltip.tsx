import * as React from "react";

/**
 * Stub Foundation (PR3)
 * Objectif: éliminer TS2307 sans introduire de dépendances UI.
 * À remplacer plus tard par une vraie implémentation (Radix/Shadcn, etc.).
 */
export type TooltipProps = {
  content: React.ReactNode;
  children: React.ReactNode;
  disabled?: boolean;
};

export function Tooltip({ children }: TooltipProps) {
  return <>{children}</>;
}

export default Tooltip;
