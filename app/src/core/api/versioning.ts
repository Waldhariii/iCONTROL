/**
 * ICONTROL_API_VERSIONING_V1
 * Versioning d'API et gestion de compatibilité
 */

export interface ApiVersion {
  version: string;
  deprecated?: boolean;
  deprecatedDate?: string;
  sunsetDate?: string;
  changes: string[];
}

export interface ApiEndpoint {
  path: string;
  method: string;
  versions: string[];
  defaultVersion?: string;
}

class ApiVersionManager {
  private versions: Map<string, ApiVersion> = new Map();
  private endpoints: Map<string, ApiEndpoint> = new Map();
  private currentVersion = "v1";

  registerVersion(version: string, info: ApiVersion) {
    this.versions.set(version, info);
  }

  registerEndpoint(endpoint: ApiEndpoint) {
    this.endpoints.set(`${endpoint.method} ${endpoint.path}`, endpoint);
  }

  getVersionInfo(version: string): ApiVersion | undefined {
    return this.versions.get(version);
  }

  isVersionDeprecated(version: string): boolean {
    const info = this.versions.get(version);
    if (!info || !info.deprecated) return false;

    if (info.sunsetDate) {
      return new Date() >= new Date(info.sunsetDate);
    }

    return info.deprecated;
  }

  getSupportedVersions(): string[] {
    return Array.from(this.versions.keys()).filter(v => !this.isVersionDeprecated(v));
  }

  getDefaultVersion(): string {
    return this.currentVersion;
  }

  validateVersion(version: string): boolean {
    const supported = this.getSupportedVersions();
    return supported.includes(version);
  }

  generateChangelog(): string {
    const versions = Array.from(this.versions.entries())
      .sort((a, b) => this.compareVersions(a[0], b[0]))
      .reverse();

    let changelog = "# API Changelog\n\n";

    versions.forEach(([version, info]) => {
      changelog += `## ${version}\n`;
      if (info.deprecated) {
        changelog += `⚠️ **DEPRECATED**`;
        if (info.deprecatedDate) {
          changelog += ` (since ${info.deprecatedDate})`;
        }
        if (info.sunsetDate) {
          changelog += ` - Sunset: ${info.sunsetDate}`;
        }
        changelog += `\n\n`;
      }
      if (info.changes.length > 0) {
        changelog += "### Changes\n";
        info.changes.forEach(change => {
          changelog += `- ${change}\n`;
        });
      }
      changelog += "\n";
    });

    return changelog;
  }

  private compareVersions(a: string, b: string): number {
    const aParts = a.replace(/^v/, "").split(".").map(Number);
    const bParts = b.replace(/^v/, "").split(".").map(Number);

    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
      const partA = aParts[i] || 0;
      const partB = bParts[i] || 0;
      if (partA < partB) return -1;
      if (partA > partB) return 1;
    }

    return 0;
  }
}

export const apiVersionManager = new ApiVersionManager();

// Version par défaut
apiVersionManager.registerVersion("v1", {
  version: "v1",
  changes: [
    "Initial API version",
    "Basic CRUD operations",
    "Authentication endpoints"
  ]
});
