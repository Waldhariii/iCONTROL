/* ICONTROL_PRODUCTION_CONFIG_V1 */
/**
 * Configuration de production pour intégration web
 * 
 * Variables d'environnement supportées:
 * - ICONTROL_APP_BASE_URL: Base URL pour l'application client (défaut: /app)
 * - ICONTROL_CP_BASE_URL: Base URL pour l'application administration (défaut: /cp)
 * - ICONTROL_API_BASE_URL: Base URL pour l'API (défaut: /api)
 * - ICONTROL_ASSETS_BASE_URL: Base URL pour les assets (défaut: /assets)
 * - ICONTROL_TENANT_ID: ID du tenant (défaut: production)
 */

module.exports = {
  // URLs de base (surchargeables via variables d'environnement)
  APP_BASE_URL: process.env.ICONTROL_APP_BASE_URL || "/app",
  CP_BASE_URL: process.env.ICONTROL_CP_BASE_URL || "/cp",
  API_BASE_URL: process.env.ICONTROL_API_BASE_URL || "/api",
  ASSETS_BASE_URL: process.env.ICONTROL_ASSETS_BASE_URL || "/assets",
  
  // Configuration tenant
  TENANT_ID: process.env.ICONTROL_TENANT_ID || "production",
  
  // Configuration runtime config
  getRuntimeConfig: function(req) {
    const host = (req.headers.host || "localhost").toString();
    const proto = (req.headers["x-forwarded-proto"] || "http").toString();
    const origin = `${proto}://${host}`;
    
    const requestedBase = req.url?.startsWith("/cp") ? this.CP_BASE_URL : this.APP_BASE_URL;
    
    return {
      tenant_id: this.TENANT_ID,
      app_base_path: this.APP_BASE_URL,
      cp_base_path: this.CP_BASE_URL,
      api_base_url: new URL(this.API_BASE_URL, origin).toString(),
      assets_base_url: new URL(this.ASSETS_BASE_URL, origin).toString(),
      requested_base: requestedBase,
      env: process.env.NODE_ENV || "production",
      version: 1,
    };
  },
};
