import React from "react";

export function EmptyState(props: { title: string; details?: string }){
  return (
    <div style={{ padding: 16, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}>
      <div style={{ fontWeight: 700 }}>{props.title}</div>
      {props.details ? <div style={{ opacity: 0.75, marginTop: 6 }}>{props.details}</div> : null}
    </div>
  );
}
