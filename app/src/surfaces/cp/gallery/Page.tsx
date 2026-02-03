import React from "react";

export default function Page() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>CP • Gallery</h1>
      <p style={{ opacity: 0.8, marginBottom: 16 }}>
        Surface CP catalog-driven (unblock route #/gallery). Replace with real tooling UI when ready.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: 16 }}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Card {i + 1}</div>
            <div style={{ opacity: 0.7 }}>Placeholder content</div>
          </div>
        ))}
      </div>
    </div>
  );
}
