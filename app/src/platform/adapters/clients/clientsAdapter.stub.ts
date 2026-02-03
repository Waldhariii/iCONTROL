import type { ClientsPort } from "../../../core/ports/clients.contract";
import type { ClientRow } from "../../../core/domain/clients/types";
import { obsEmit } from "../../../core/ports/observability.facade";

const seed: ClientRow[] = [];

export const clientsPortStub: ClientsPort = {
  async queryClients({ tenantId, correlationId, query }) {
    obsEmit({
      name: "clients.query.stub",
      ts: Date.now(),
      level: "info",
      tags: { tenantId, correlationId },
      data: { q: query.q ?? "", status: query.status ?? "all" },
    });

    const status = query.status ?? "all";
    const q = (query.q ?? "").toLowerCase().trim();

    let rows = seed.slice();
    if (status !== "all") rows = rows.filter(r => r.status === status);
    if (q) rows = rows.filter(r =>
      r.name.toLowerCase().includes(q) ||
      (r.email ?? "").toLowerCase().includes(q) ||
      (r.city ?? "").toLowerCase().includes(q)
    );

    const total = rows.length;

    if (query.sort) {
      const { key, dir } = query.sort;
      rows.sort((a,b) => {
        const av = String(a[key] ?? "");
        const bv = String(b[key] ?? "");
        return dir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      });
    }

    const offset = Math.max(0, query.offset ?? 0);
    const limit = Math.max(1, Math.min(200, query.limit ?? 50));
    rows = rows.slice(offset, offset + limit);

    return { rows, total };
  },
};
