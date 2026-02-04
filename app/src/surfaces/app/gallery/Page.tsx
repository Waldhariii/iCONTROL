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
      <div className="icx-gallery-page-0-4fceb9e82e">
        <h1>Galerie — Pages métier</h1>
        <p>Vue de pilotage pour QA visuel / review. Les pages restent surfaces-first, ports-driven.</p>

        <div className="icx-gallery-page-1-6099a3814d">
          {LINKS.map(l => (
            <a key={l.href} href={l.href} className="icx-gallery-page-2-30199e1be8">
              <div className="icx-gallery-page-3-d6b6ae3df2">{l.label}</div>
              <div className="icx-gallery-page-4-5bfaf1f9a8">{l.href}</div>
              {l.note ? <div className="icx-gallery-page-5-980b16c94c">{l.note}</div> : null}
            </a>
          ))}
        </div>
      </div>
    );
  });
}
