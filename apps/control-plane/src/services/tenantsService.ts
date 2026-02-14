import { getApiBase } from '../core/runtime/apiBase';
import { getAuthHeaders } from './authService';

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
  const response = await fetch(`${getApiBase()}/api/tenants`, {
    headers: getAuthHeaders(),
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch tenants');
  }
  
  const result = await response.json();
  return result.data || [];
}

export async function createTenant(data: { id: string; name: string; plan?: string }) {
  const response = await fetch(`${getApiBase()}/api/tenants`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create tenant');
  }
  
  const result = await response.json();
  return result.data;
}

export async function updateTenant(id: string, data: { name?: string; plan?: string; status?: string }) {
  const response = await fetch(`${getApiBase()}/api/tenants/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update tenant');
  }
  
  const result = await response.json();
  return result.data;
}
