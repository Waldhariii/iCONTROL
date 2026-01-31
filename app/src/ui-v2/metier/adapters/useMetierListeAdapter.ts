import { useMemo } from "react";
import type { MetierScreenModel } from "../models/metierModels";

/**
 * Adapter Liste (mock)
 * - Modèle stable pour DataTableMetierV2 / DataTableSortableMetierV2.
 */
export function useMetierListeAdapter(): MetierScreenModel {
  return useMemo(() => {
    const columns = [
      { key: "ref", label: "Réf." },
      { key: "client", label: "Client" },
      { key: "ville", label: "Ville" },
      { key: "statut", label: "Statut" },
      { key: "date", label: "Date", align: "right" as const },
    ];

    const rows = [
      { id: "r1", cells: { ref: "J-1042", client: "Safari Park", ville: "Montréal", statut: "Scheduled", date: "2026-01-31" } },
      { id: "r2", cells: { ref: "J-1043", client: "Dupont", ville: "Laval", statut: "Open", date: "2026-02-01" } },
      { id: "r3", cells: { ref: "J-1044", client: "Bouchard", ville: "Longueuil", statut: "Done", date: "2026-01-29" } },
    ];

    return {
      screenId: "liste",
      title: "Liste (Excel)",
      subtitle: "Table principale (mock)",
      filters: { status: "all", range: "month", query: "" },
      table: {
        columns,
        rows,
        defaultSort: { key: "date", dir: "desc" },
      },
    };
  }, []);
}
