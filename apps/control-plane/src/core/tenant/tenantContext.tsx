import React, { createContext, useContext, ReactNode } from 'react';

interface TenantContextValue {
  tenantId: string;
  tenantName?: string;
}

const TenantContext = createContext<TenantContextValue | null>(null);

interface TenantProviderProps {
  children: ReactNode;
  tenantId: string;
  tenantName?: string;
}

export function TenantProvider({ children, tenantId, tenantName }: TenantProviderProps) {
  return (
    <TenantContext.Provider value={{ tenantId, tenantName }}>
      {children}
    </TenantContext.Provider>
  );
}

export function useTenantContext() {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenantContext must be used within TenantProvider');
  }
  return context;
}
