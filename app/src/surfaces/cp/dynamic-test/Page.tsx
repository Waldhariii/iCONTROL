import React from 'react';
import { usePageQueries } from './queries';
import { usePageCommands } from './commands';

export default function DynamicTestPage() {
  const { data, isLoading } = usePageQueries();
  const { handleTestAction } = usePageCommands();

  if (isLoading) {
    return <div className="loading-state">Chargement...</div>;
  }

  return (
    <div className="page-container">
      <h1>🎉 {data.title}</h1>

      <div className="success-panel">
        <h2>✅ Système Hybride Fonctionnel</h2>
        <ul>
          <li>✅ Router: dynamic_test_cp</li>
          <li>✅ moduleLoader.ts → manifest.ts</li>
          <li>✅ Chargement React dynamique</li>
          <li>✅ Tenant: {data.tenantId}</li>
          <li>✅ Write Gateway ready</li>
        </ul>
      </div>

      <button
        onClick={handleTestAction}
        className="btn-primary"
      >
        🧪 Tester Write Gateway
      </button>
    </div>
  );
}
