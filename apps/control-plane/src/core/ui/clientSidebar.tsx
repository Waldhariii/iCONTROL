import React from "react";

type Item = { label: string; href: string };

const ITEMS: Item[] = [
  { label: "Dashboard", href: "#/dashboard" },
  { label: "Compte", href: "#/account" },
  { label: "Paramètres", href: "#/settings" },
  { label: "Utilisateurs", href: "#/users" },
  { label: "Système", href: "#/system" },
];

export function ClientSidebar() {
  const [open, setOpen] = React.useState(true);

  return (
    <div style={{ display: "flex", height: "100vh", width: "100%" }}>
      <aside
        style={{
          width: open ? 260 : 56,
          transition: "width 180ms ease",
          borderRight: "1px solid var(--ic-highlight)",
          background: "var(--bg-card)",
          padding: 12,
          boxSizing: "border-box",
        }}
      >
        <div style={{ display: "flex", justifyContent: open ? "space-between" : "center", alignItems: "center", gap: 8 }}>
          {open && <div style={{ fontWeight: 700, letterSpacing: 0.3 }}>Client</div>}
          <button
            onClick={() => setOpen(v => !v)}
            style={{
              cursor: "pointer",
              border: "1px solid var(--ic-borderLight)",
              background: "transparent",
              borderRadius: 10,
              padding: "6px 10px",
              color: "inherit",
            }}
            aria-label="Toggle sidebar"
          >
            {open ? "⟨⟨" : "⟩⟩"}
          </button>
        </div>

        <div style={{ marginTop: 14, display: "flex", flexDirection: "column", gap: 6 }}>
          {ITEMS.map((it) => (
            <a
              key={it.href}
              href={it.href}
              style={{
                textDecoration: "none",
                color: "inherit",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 10px",
                borderRadius: 12,
                border: "1px solid var(--ic-borderLightMuted)",
                background: "var(--ic-surfaceOverlay)",
              }}
            >
              <span style={{ width: 18, textAlign: "center", opacity: 0.8 }}>•</span>
              {open && <span>{it.label}</span>}
            </a>
          ))}
        </div>
      </aside>

      <main style={{ flex: 1, padding: 18, overflow: "auto" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <div style={{ opacity: 0.8, marginBottom: 10, fontSize: 12 }}>Client V2 — socle reconstruit</div>
          <div id="__CLIENT_PAGE_SLOT__" />
        </div>
      </main>
    </div>
  );
}
