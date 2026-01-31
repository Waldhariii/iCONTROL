/**
 * UI-V2 Métier Models (stable contracts)
 * - Les pages consomment ces modèles
 * - Les adapters produisent ces modèles (mock aujourd'hui, API demain)
 */

export type MetierKpi = {
  id: string;
  label: string;
  value: string;
  trend?: "up" | "down" | "flat";
};

export type MetierCard = {
  id: string;
  title: string;
  subtitle?: string;
  tone?: "default" | "success" | "warning" | "danger";
  meta?: Array<{ label: string; value: string }>;
};

export type MetierTableColumn = {
  key: string;
  label: string;
  width?: number; // px (optionnel)
  align?: "left" | "center" | "right";
};

export type MetierTableRow = {
  id: string;
  cells: Record<string, string>;
};

export type MetierFilters = {
  query?: string;
  status?: "all" | "open" | "scheduled" | "done" | "archived";
  range?: "today" | "week" | "month" | "quarter" | "year" | "custom";
};

export type MetierScreenModel = {
  screenId: "dashboard" | "liste" | "fiche";
  title: string;
  subtitle?: string;

  kpis?: MetierKpi[];
  cards?: MetierCard[];

  filters?: MetierFilters;

  table?: {
    columns: MetierTableColumn[];
    rows: MetierTableRow[];
    defaultSort?: { key: string; dir: "asc" | "desc" };
  };

  form?: {
    sections: Array<{
      id: string;
      title: string;
      fields: Array<{
        id: string;
        label: string;
        kind: "text" | "number" | "email" | "phone" | "select" | "date" | "textarea";
        placeholder?: string;
        required?: boolean;
        value?: string;
        options?: Array<{ label: string; value: string }>;
        helpText?: string;
      }>;
    }>;
  };
};
