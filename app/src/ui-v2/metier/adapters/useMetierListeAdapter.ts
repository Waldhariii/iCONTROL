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
      { id: "r1", cells: { ref: "REF-0001", client: "Customer A", ville: "City A", statut: "Scheduled", date: "2026-01-31" } },
      { id: "r2", cells: { ref: "REF-0002", client: "Customer B", ville: "City B", statut: "Open", date: "2026-02-01" } },
      { id: "r3", cells: { ref: "REF-0003", client: "Customer C", ville: "City C", statut: "Done", date: "2026-01-29" } },
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
