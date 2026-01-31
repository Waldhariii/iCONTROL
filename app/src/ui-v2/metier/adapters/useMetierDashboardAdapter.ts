import { useMemo } from "react";
import type { MetierScreenModel } from "../models/metierModels";

/**
 * Adapter Dashboard (mock aujourd'hui)
 * Demain: brancher sur services/api sans changer la page.
 */
export function useMetierDashboardAdapter(): MetierScreenModel {
  return useMemo(() => {
    return {
      screenId: "dashboard",
      title: "Tableau de bord",
      subtitle: "Vue synthèse (mock)",
      kpis: [
        { id: "k1", label: "Jobs aujourd’hui", value: "7", trend: "up" },
        { id: "k2", label: "En cours", value: "12", trend: "flat" },
        { id: "k3", label: "Acceptées", value: "5", trend: "up" },
        { id: "k4", label: "Revenus (mois)", value: "$18 240", trend: "up" },
      ],
      cards: [
        {
          id: "c1",
          title: "Priorités",
          subtitle: "À traiter",
          tone: "warning",
          meta: [
            { label: "Retards", value: "2" },
            { label: "À confirmer", value: "3" },
          ],
        },
        {
          id: "c2",
          title: "Qualité",
          subtitle: "Satisfaction",
          tone: "success",
          meta: [
            { label: "Score", value: "4.7/5" },
            { label: "Avis", value: "39" },
          ],
        },
      ],
      filters: { status: "all", range: "week" },
    };
  }, []);
}
