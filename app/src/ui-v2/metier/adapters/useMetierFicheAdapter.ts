import { useMemo } from "react";
import type { MetierScreenModel } from "../models/metierModels";

/**
 * Adapter Fiche (mock)
 * - Modèle stable pour FormMetierV2 / FormValidationMetierV2.
 */
export function useMetierFicheAdapter(): MetierScreenModel {
  return useMemo(() => {
    return {
      screenId: "fiche",
      title: "Fiche job",
      subtitle: "Détails + formulaire (mock)",
      form: {
        sections: [
          {
            id: "s-client",
            title: "Client",
            fields: [
              { id: "clientName", label: "Nom", kind: "text", placeholder: "Nom du client", required: true, value: "Safari Park" },
              { id: "clientPhone", label: "Téléphone", kind: "phone", placeholder: "(514) 000-0000", value: "" },
              { id: "clientEmail", label: "Courriel", kind: "email", placeholder: "client@exemple.com", value: "" },
            ],
          },
          {
            id: "s-job",
            title: "Intervention",
            fields: [
              { id: "address", label: "Adresse", kind: "text", placeholder: "Adresse", required: true, value: "123 Rue Exemple" },
              {
                id: "status",
                label: "Statut",
                kind: "select",
                required: true,
                value: "scheduled",
                options: [
                  { label: "Ouvert", value: "open" },
                  { label: "Planifié", value: "scheduled" },
                  { label: "Terminé", value: "done" },
                  { label: "Archivé", value: "archived" },
                ],
              },
              { id: "notes", label: "Notes", kind: "textarea", placeholder: "Notes internes…", value: "" },
            ],
          },
        ],
      },
    };
  }, []);
}
