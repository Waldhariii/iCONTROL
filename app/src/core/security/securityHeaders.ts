/**
 * ICONTROL_SECURITY_HEADERS_V1
 * Configuration et validation des security headers
 */

export interface SecurityHeadersConfig {
  contentSecurityPolicy?: string;
  strictTransportSecurity?: string;
  xFrameOptions?: string;
  xContentTypeOptions?: string;
  referrerPolicy?: string;
  permissionsPolicy?: string;
}

// CSP strict pour production (sans unsafe-inline/unsafe-eval)
const STRICT_CSP_PROD = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join("; ");

// CSP pour développement (avec unsafe pour hot reload)
const STRICT_CSP_DEV = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'"
].join("; ");

// CSP selon environnement
export const STRICT_CSP = (() => {
  try {
    const isProd = import.meta.env?.PROD === true || 
                   import.meta.env?.MODE === 'production' ||
                   (typeof window !== 'undefined' && window.location.hostname !== 'localhost');
    return isProd ? STRICT_CSP_PROD : STRICT_CSP_DEV;
  } catch {
    return STRICT_CSP_PROD; // Par défaut, production sécurisée
  }
})();

export const DEFAULT_SECURITY_HEADERS: SecurityHeadersConfig = {
  contentSecurityPolicy: STRICT_CSP,
  strictTransportSecurity: "max-age=31536000; includeSubDomains; preload",
  xFrameOptions: "DENY",
  xContentTypeOptions: "nosniff",
  referrerPolicy: "strict-origin-when-cross-origin",
  permissionsPolicy: "geolocation=(), microphone=(), camera=()"
};

export function getSecurityHeaders(config: Partial<SecurityHeadersConfig> = {}): Record<string, string> {
  const headers: Record<string, string> = {};
  const finalConfig = { ...DEFAULT_SECURITY_HEADERS, ...config };

  if (finalConfig.contentSecurityPolicy) {
    headers["Content-Security-Policy"] = finalConfig.contentSecurityPolicy;
  }
  if (finalConfig.strictTransportSecurity) {
    headers["Strict-Transport-Security"] = finalConfig.strictTransportSecurity;
  }
  if (finalConfig.xFrameOptions) {
    headers["X-Frame-Options"] = finalConfig.xFrameOptions;
  }
  if (finalConfig.xContentTypeOptions) {
    headers["X-Content-Type-Options"] = finalConfig.xContentTypeOptions;
  }
  if (finalConfig.referrerPolicy) {
    headers["Referrer-Policy"] = finalConfig.referrerPolicy;
  }
  if (finalConfig.permissionsPolicy) {
    headers["Permissions-Policy"] = finalConfig.permissionsPolicy;
  }

  return headers;
}

// Note: Ces headers doivent être appliqués au niveau serveur (Nginx, Apache, ou middleware)
// Cette fonction fournit les valeurs recommandées

export function validateSecurityHeaders(headers: Record<string, string>): {
  valid: boolean;
  missing: string[];
  warnings: string[];
} {
  const required = [
    "Content-Security-Policy",
    "X-Frame-Options",
    "X-Content-Type-Options"
  ];

  const recommended = [
    "Strict-Transport-Security",
    "Referrer-Policy",
    "Permissions-Policy"
  ];

  const missing: string[] = [];
  const warnings: string[] = [];

  required.forEach(header => {
    if (!headers[header] && !headers[header.toLowerCase()]) {
      missing.push(header);
    }
  });

  recommended.forEach(header => {
    if (!headers[header] && !headers[header.toLowerCase()]) {
      warnings.push(header);
    }
  });

  return {
    valid: missing.length === 0,
    missing,
    warnings
  };
}
