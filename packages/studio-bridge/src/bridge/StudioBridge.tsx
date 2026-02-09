import React, { useState, useEffect } from 'react';
import { PageErrorBoundary } from '../components/PageErrorBoundary';

/**
 * StudioBridge
 * 
 * Pont React vers le moteur Studio LEGACY
 * - Charge le blueprint depuis DB via loader LEGACY
 * - Utilise le runtime LEGACY pour render
 * - Wrappe dans Error Boundaries
 */

interface StudioBridgeProps {
  pageId: string;
  tenantId: string;
  userCapabilities?: string[];
}

export const StudioBridge: React.FC<StudioBridgeProps> = ({
  pageId,
  tenantId,
  userCapabilities = []
}) => {
  const [blueprint, setBlueprint] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBlueprintAndRender();
  }, [pageId, tenantId]);

  const loadBlueprintAndRender = async () => {
    try {
      setLoading(true);
      setError(null);

      // Import dynamic du loader LEGACY
      const { loadBlueprintFromDB } = await import(
        '../../../app/src/core/studio/blueprints/loaders'
      );

      // Charger le blueprint depuis DB
      const bp = await loadBlueprintFromDB(pageId, tenantId);

      if (!bp) {
        throw new Error(`Blueprint ${pageId} not found`);
      }

      // TODO: Utiliser le runtime LEGACY pour render
      // Pour l'instant, on stocke juste le blueprint
      setBlueprint(bp);
      setLoading(false);
    } catch (err: any) {
      console.error('StudioBridge load error:', err);
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '400px',
        color: '#9198a1'
      }}>
        Loading page...
      </div>
    );
  }

  if (error || !blueprint) {
    return (
      <div style={{
        padding: '2rem',
        textAlign: 'center',
        color: '#f85149'
      }}>
        Failed to load page: {error || 'Blueprint not found'}
      </div>
    );
  }

  return (
    <PageErrorBoundary pageId={pageId}>
      <div style={{ padding: '1rem' }}>
        <h2 style={{ color: '#e6edf3' }}>
          {blueprint.meta.name || pageId}
        </h2>
        <pre style={{
          background: '#161b22',
          padding: '1rem',
          borderRadius: '8px',
          overflow: 'auto',
          fontSize: '0.875rem',
          color: '#9198a1'
        }}>
          {JSON.stringify(blueprint, null, 2)}
        </pre>
        <p style={{ color: '#6e7681', marginTop: '1rem' }}>
          TODO: Render avec runtime LEGACY au lieu d'afficher le JSON
        </p>
      </div>
    </PageErrorBoundary>
  );
};
