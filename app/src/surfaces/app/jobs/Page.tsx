import { withSpan } from "../_shared/telemetry";

export default function Page(){
  return withSpan("jobs", () => {
    return (
      <div style={{ padding: 24 }}>
        <h1>Jobs</h1>
        <p>Wave 1 — stub. Prochain sprint: vues (jour/semaine/mois) + acceptation + pipeline.</p>
      </div>
    );
  });
}
