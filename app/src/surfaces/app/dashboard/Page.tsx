import { withSpan } from "../_shared/telemetry";

export default function Page(){
  return withSpan("dashboard", () => {
    return (
      <div style={{ padding: 24 }}>
        <h1>Dashboard</h1>
        <p>Wave 1 — KPIs et graphiques branchables via ports (Finance/Jobs/Clients).</p>

        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap: 12, marginTop: 16 }}>
          <Card title="Revenus (jour)" value="—" />
          <Card title="Jobs (jour)" value="—" />
          <Card title="Taux acceptation" value="—" />
          <Card title="Appels" value="—" />
        </div>

        <div style={{ marginTop: 20, padding: 16, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12 }}>
          <h2>Graphique</h2>
          <p>Placeholder — intégration chart au Sprint suivant (catalog-driven widgets).</p>
        </div>
      </div>
    );
  });
}

function Card({ title, value }: { title: string; value: string }){
  return (
    <div style={{ padding: 16, border: "1px solid rgba(0,0,0,0.12)", borderRadius: 12 }}>
      <div style={{ opacity: 0.7 }}>{title}</div>
      <div style={{ fontSize: 28, marginTop: 8 }}>{value}</div>
    </div>
  );
}
