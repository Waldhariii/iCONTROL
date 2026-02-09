import { useTenantContext } from '@/core/tenant/tenantContext';

export function usePageQueries() {
  const { tenantId } = useTenantContext();

  return {
    data: {
      title: 'Test Page Dynamique',
      message: 'Système hybride fonctionnel!',
      tenantId
    },
    isLoading: false
  };
}
