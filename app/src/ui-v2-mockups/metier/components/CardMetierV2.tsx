import React from "react";

export function CardMetierV2({ title, children }: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{
      border: "1px solid var(--ui-border, #2a2a2a)",
      borderRadius: 12,
      padding: 16,
      background: "var(--ui-surface, #121212)"
    }}>
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </div>
  );
}
