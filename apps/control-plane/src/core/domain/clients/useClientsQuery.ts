import { useEffect, useMemo, useState } from "react";
import type { ClientListQueryV1, ClientV1, ClientWriteMeta } from "./types";
import type { ClientsPort } from "../../ports/clients.contract";

function mkCorrelationId(){
  return `corr_ui_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export type UseClientsQueryArgs = {
  port: ClientsPort;
  tenantId: string;
  limit?: number;
  offset?: number;
  sortBy?: "name" | "updatedAt" | "createdAt" | "status";
  sortDir?: "asc" | "desc";
};

export function useClientsQuery(args: UseClientsQueryArgs){
  const { port, tenantId } = args;
  const limit = args.limit ?? 50;
  const offset = args.offset ?? 0;
  const sortBy = args.sortBy ?? "name";
  const sortDir = args.sortDir ?? "asc";

  const [rows, setRows] = useState<ClientV1[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const req: ClientListQueryV1 = useMemo(() => ({
    limit,
    cursor: offset > 0 ? String(offset) : null,
    sort: { by: sortBy, dir: sortDir },
  }), [tenantId, limit, offset, sortBy, sortDir]);

  const meta: ClientWriteMeta = useMemo(() => ({
    tenantId,
    correlationId: mkCorrelationId(),
  }), [tenantId]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    port.list(req, meta)
      .then((res) => {
        if (!alive) return;
        setRows(res.items ?? []);
        setTotal(res.items?.length ?? 0);
        setLoading(false);
      })
      .catch((e: any) => {
        if (!alive) return;
        const msg = e?.message ?? String(e);
        setError(msg);
        setLoading(false);
      });

    return () => { alive = false; };
  }, [port, req, meta]);

  return { rows, total, loading, error, req };
}
