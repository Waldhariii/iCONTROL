import { useMemo, useState } from "react";
import { withSpan } from "../_shared/telemetry";

type ClientRow = { id: string; name: string; phone?: string; email?: string; city?: string; status?: string; };

const SAMPLE: ClientRow[] = [
  { id:"c-001", name:"Client Démo 1", phone:"555-0101", email:"demo1@example.com", city:"Ville A", status:"Actif" },
  { id:"c-002", name:"Client Démo 2", phone:"555-0102", email:"demo2@example.com", city:"Ville B", status:"Prospect" },
];

export default function Page(){
  return withSpan("clients", () => {
    const [q, setQ] = useState("");
    const rows = useMemo(()=>{
      const s = q.trim().toLowerCase();
      if(!s) return SAMPLE;
      return SAMPLE.filter(r => JSON.stringify(r).toLowerCase().includes(s));
    }, [q]);

    return (
      <div style={{ padding: 24 }}>
        <h1>Clients</h1>
        <p>Wave 1 — table style Excel. Datasource réelle au sprint suivant (VFS/Snapshot + module catalog).</p>

        <div style={{ marginTop: 12, display:"flex", gap: 12 }}>
          <input placeholder="Recherche..." value={q} onChange={(e)=>setQ(e.target.value)} style={{ flex: 1, padding: 10 }} />
          <button style={{ padding: "10px 14px" }}>Nouveau client</button>
        </div>

        <div style={{ marginTop: 16, overflow:"auto", border:"1px solid rgba(0,0,0,0.12)", borderRadius: 12 }}>
          <table style={{ width:"100%", borderCollapse:"collapse" }}>
            <thead>
              <tr>
                {["ID","Nom","Téléphone","Email","Ville","Statut"].map(h=>(
                  <th key={h} style={{ textAlign:"left", padding: 10, borderBottom:"1px solid rgba(0,0,0,0.12)", position:"sticky", top:0, background:"#fff" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map(r=>(
                <tr key={r.id}>
                  <td style={cell()}>{r.id}</td>
                  <td style={cell()}>{r.name}</td>
                  <td style={cell()}>{r.phone || "—"}</td>
                  <td style={cell()}>{r.email || "—"}</td>
                  <td style={cell()}>{r.city || "—"}</td>
                  <td style={cell()}>{r.status || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  });
}

function cell(){
  return { padding: 10, borderBottom:"1px solid rgba(0,0,0,0.06)", whiteSpace:"nowrap" } as const;
}
