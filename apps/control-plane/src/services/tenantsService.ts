import { cpFetchJson } from "@/platform/http/cpApi";

export interface Tenant {
  id: string;
  name: string;
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  status: 'active' | 'suspended' | 'canceled';
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export async function getTenants(): Promise<Tenant[]> {
  const result = await cpFetchJson<{ data?: Tenant[] }>("/api/tenants");
  return result?.data ?? [];
}

export async function createTenant(data: { id: string; name: string; plan?: string }) {
  const result = await cpFetchJson<{ data?: Tenant }>("/api/tenants", {
    method: "POST",
    body: JSON.stringify(data),
  });
  return result?.data;
}

export async function updateTenant(id: string, data: { name?: string; plan?: string; status?: string }) {
  const result = await cpFetchJson<{ data?: Tenant }>(`/api/tenants/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
  return result?.data;
}
