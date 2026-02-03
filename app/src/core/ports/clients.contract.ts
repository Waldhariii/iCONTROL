import type { ClientQuery, ClientQueryResult } from "../domain/clients/types";

export type ClientsPort = {
  queryClients: (args: {
    tenantId: string;
    correlationId: string;
    query: ClientQuery;
  }) => Promise<ClientQueryResult>;
};

export const CLIENTS_PORT_CONTRACT = "v1.clients.port";
