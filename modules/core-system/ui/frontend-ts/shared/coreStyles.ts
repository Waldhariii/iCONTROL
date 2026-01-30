/**
 * Styles de base minimaux — visuels désactivés pour stabilité.
 * Conserve uniquement: box-sizing, reset body. Toutes les couleurs, tokens, classes
 * (.cxCard, .cxTitle, etc.) ont été retirés. Les fonctions (DOM, événements) restent.
 */
export function coreBaseStyles(): string {
  return `<style>*{box-sizing:border-box}body{margin:0;padding:0}</style>`;
}
