/**
 * Get API base URL
 */
export function getApiBase(): string {
  // En développement, utiliser le backend local
  if (import.meta.env.DEV) {
    return 'http://localhost:3001';
  }
  
  // En production, utiliser l'URL configurée ou relative
  return import.meta.env.VITE_API_URL || '';
}
