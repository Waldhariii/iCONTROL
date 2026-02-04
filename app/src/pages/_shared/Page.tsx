import React from "react";

export function Page(props: {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
}){
  const { title, subtitle, children } = props;
  return (
    <div style={{ padding: 16 }}>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 700 }}>{title}</div>
        {subtitle ? <div style={{ opacity: 0.75, marginTop: 4 }}>{subtitle}</div> : null}
      </div>
      {children}
    </div>
  );
}
