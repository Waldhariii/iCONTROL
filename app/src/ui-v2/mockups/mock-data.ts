export type MetierRow = {
  id: string;
  client: string;
  statut: "Nouveau" | "En cours" | "Planifié" | "Complété";
  montant: number;
  date: string; // YYYY-MM-DD
};

export const METIER_ROWS: MetierRow[] = [
  { id: "J-1001", client: "Safari Park", statut: "Nouveau",   montant: 420.00, date: "2026-01-25" },
  { id: "J-1002", client: "Clinique Nord", statut: "En cours", montant: 980.00, date: "2026-01-26" },
  { id: "J-1003", client: "Bistro Mauve",  statut: "Planifié", montant: 210.00, date: "2026-01-30" },
  { id: "J-1004", client: "Entrepôt 7",    statut: "Complété", montant: 1550.00, date: "2026-01-18" },
];
