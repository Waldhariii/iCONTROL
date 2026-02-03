import { withSpan } from "../_shared/telemetry";

type Link = { label: string; href: string; note?: string };

const LINKS: Link[] = [
  { label: "Login", href: "#/login", note: "auth stub" },
  { label: "Dashboard", href: "#/dashboard", note: "KPI shell" },
  { label: "Clients", href: "#/clients", note: "Excel-like table" },
  { label: "Jobs", href: "#/jobs", note: "stub" },
];

export default function Page(){
  return withSpan("gallery", () => {
    return (
      <div style={{ padding: 24, maxWidth: 900, margin: "0 auto" }}>
        <h1>Galerie — Pages métier</h1>
        <p>Vue de pilotage pour QA visuel / review. Les pages restent surfaces-first, ports-driven.</p>

        <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 12 }}>
          {LINKS.map(l => (
            <a key={l.href} href={l.href} style={{ display:"block", padding: 16, border: "1px solid var(--color-border-subtle, #d9d9d9)", borderRadius: 12, textDecoration: "none", color: "inherit" }}>
              <div style={{ fontSize: 18, fontWeight: 600 }}>{l.label}</div>
              <div style={{ marginTop: 6, opacity: 0.8 }}>{l.href}</div>
              {l.note ? <div style={{ marginTop: 10, opacity: 0.65 }}>{l.note}</div> : null}
            </a>
          ))}
        </div>
      </div>
    );
  });
}
