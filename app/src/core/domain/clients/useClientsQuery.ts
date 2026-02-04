import { useEffect, useMemo, useState } from "react";
import type { ClientsPort, ClientsListRequest, ClientsListResponse, ClientRow } from "../../ports/clients.contract";

function mkCorrelationId(){
  return `corr_ui_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

export type UseClientsQueryArgs = {
  port: ClientsPort;
  tenantId: string;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

export function useClientsQuery(args: UseClientsQueryArgs){
  const { port, tenantId } = args;
  const limit = args.limit ?? 50;
  const offset = args.offset ?? 0;
  const sortBy = args.sortBy ?? "name";
  const sortDir = args.sortDir ?? "asc";

  const [rows, setRows] = useState<ClientRow[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const req: ClientsListRequest = useMemo(() => ({
    tenantId,
    limit,
    offset,
    sort: { by: sortBy, dir: sortDir },
    correlationId: mkCorrelationId(),
  }), [tenantId, limit, offset, sortBy, sortDir]);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError(null);

    port.list(req)
      .then((res: ClientsListResponse) => {
        if (!alive) return;
        setRows(res.rows ?? []);
        setTotal(res.total ?? (res.rows?.length ?? 0));
        setLoading(false);
      })
      .catch((e: any) => {
        if (!alive) return;
        const msg = e?.message ?? String(e);
        setError(msg);
        setLoading(false);
      });

    return () => { alive = false; };
  }, [port, req]);

  return { rows, total, loading, error, req };
}
