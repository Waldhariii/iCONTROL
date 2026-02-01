import { PageShellV2 } from "../ui-v2/layouts/PageShellV2";
import { ButtonV2 } from "../ui-v2/components/ButtonV2";

export function UiMetierMockups() {
  return (
    <PageShellV2 title="UI Métier — Sandbox">
      <div style={{ display: "grid", gap: 16 }}>
        <section>
          <h2>Carte — Dashboard Métier</h2>
          <ButtonV2 label="Action primaire" />
        </section>

        <section>
          <h2>Carte — Fiche Client</h2>
          <ButtonV2 label="Voir client" />
        </section>

        <section>
          <h2>Carte — Liste Jobs</h2>
          <ButtonV2 label="Ouvrir liste" />
        </section>
      </div>
    </PageShellV2>
  );
}
