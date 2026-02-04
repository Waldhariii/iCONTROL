import React from "react";

export function ErrorState(props: { title: string; details?: string }){
  return (
    <div style={{ padding: 16, border: "1px solid rgba(255,0,0,0.25)", borderRadius: 12 }}>
      <div style={{ fontWeight: 800 }}>{props.title}</div>
      {props.details ? <pre style={{ marginTop: 8, opacity: 0.85, whiteSpace: "pre-wrap" }}>{props.details}</pre> : null}
    </div>
  );
}
