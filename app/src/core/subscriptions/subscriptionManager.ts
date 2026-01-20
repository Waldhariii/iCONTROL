/**
 * ICONTROL_SUBSCRIPTION_MANAGER_V1
 * Gestionnaire d'abonnements avec activation immédiate
 */

import type { SubscriptionType, SubscriptionStatus } from "./subscriptionTypes";

export interface ActiveSubscription {
  id: string;
  subscriptionTypeId: string;
  providerName: string;
  status: SubscriptionStatus;
  activatedAt: string;
  expiresAt?: string;
  configuration?: Record<string, any>;
}

const STORAGE_KEY = "icontrol_active_subscriptions_v1";

export function getActiveSubscriptions(): ActiveSubscription[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

export function saveActiveSubscriptions(subscriptions: ActiveSubscription[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(subscriptions));
  } catch (e) {
    console.error("Erreur lors de la sauvegarde des abonnements:", e);
  }
}

export function activateSubscription(
  subscriptionTypeId: string,
  providerName: string,
  expiresAt?: string,
  configuration?: Record<string, any>
): ActiveSubscription {
  const subscriptions = getActiveSubscriptions();
  
  // Vérifier si déjà actif
  const existing = subscriptions.find(s => 
    s.subscriptionTypeId === subscriptionTypeId && s.status === "active"
  );
  
  if (existing) {
    // Mettre à jour l'existant
    existing.providerName = providerName;
    existing.expiresAt = expiresAt;
    existing.configuration = configuration;
    existing.status = "active";
    saveActiveSubscriptions(subscriptions);
    return existing;
  }
  
  // Créer un nouvel abonnement
  const newSubscription: ActiveSubscription = {
    id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    subscriptionTypeId,
    providerName,
    status: "active",
    activatedAt: new Date().toISOString(),
    expiresAt,
    configuration
  };
  
  subscriptions.push(newSubscription);
  saveActiveSubscriptions(subscriptions);
  
  return newSubscription;
}

export function deactivateSubscription(subscriptionId: string): void {
  const subscriptions = getActiveSubscriptions();
  const index = subscriptions.findIndex(s => s.id === subscriptionId);
  
  if (index !== -1) {
    subscriptions[index].status = "inactive";
    subscriptions[index].expiresAt = new Date().toISOString();
    saveActiveSubscriptions(subscriptions);
  }
}

export function removeSubscription(subscriptionId: string): void {
  const subscriptions = getActiveSubscriptions();
  const filtered = subscriptions.filter(s => s.id !== subscriptionId);
  saveActiveSubscriptions(filtered);
}

export function getActiveSubscriptionByType(subscriptionTypeId: string): ActiveSubscription | undefined {
  const subscriptions = getActiveSubscriptions();
  return subscriptions.find(s => 
    s.subscriptionTypeId === subscriptionTypeId && s.status === "active"
  );
}

export function isSubscriptionActive(subscriptionTypeId: string): boolean {
  const sub = getActiveSubscriptionByType(subscriptionTypeId);
  if (!sub) return false;
  
  // Vérifier expiration
  if (sub.expiresAt) {
    const expiresAt = new Date(sub.expiresAt);
    const now = new Date();
    if (expiresAt < now) {
      sub.status = "expired";
      saveActiveSubscriptions(getActiveSubscriptions());
      return false;
    }
  }
  
  return sub.status === "active";
}

/**
 * Lier un abonnement au système et activer les fonctionnalités associées
 */
export async function linkSubscriptionToSystem(
  subscriptionTypeId: string,
  configuration?: Record<string, any>
): Promise<{ success: boolean; message: string; capabilities?: string[] }> {
  try {
    const activeSub = getActiveSubscriptionByType(subscriptionTypeId);
    if (!activeSub) {
      return { success: false, message: "Abonnement non trouvé" };
    }
    
    // Vérifier que l'abonnement est actif
    if (!isSubscriptionActive(subscriptionTypeId)) {
      return { success: false, message: "Abonnement non actif" };
    }
    
    // Si des credentials sont fournis, tester la connexion
    if (configuration?.apiKey || configuration?.endpoint) {
      try {
        // Tester la connexion réelle (simulé pour l'instant)
        // Dans un vrai système, on ferait un appel API au provider
        const connectionTest = await testProviderConnection(configuration);
        if (!connectionTest.success) {
          return { success: false, message: `Erreur de connexion: ${connectionTest.message}` };
        }
      } catch (error: any) {
        return { success: false, message: `Erreur lors du test de connexion: ${error.message}` };
      }
    }
    
    // Activer les fonctionnalités liées à cet abonnement dans le système
    const capabilities = activateSubscriptionCapabilities(subscriptionTypeId, activeSub);
    
    // Mettre à jour la configuration avec le statut de liaison
    const subscriptions = getActiveSubscriptions();
    const index = subscriptions.findIndex(s => s.id === activeSub.id);
    if (index !== -1) {
      subscriptions[index].configuration = {
        ...(subscriptions[index].configuration || {}),
        ...configuration,
        _linkedToSystem: true,
        _linkedAt: new Date().toISOString(),
        _capabilities: capabilities
      };
      saveActiveSubscriptions(subscriptions);
    }
    
    return {
      success: true,
      message: "Abonnement lié au système avec succès",
      capabilities
    };
  } catch (error: any) {
    return { success: false, message: `Erreur lors de la liaison: ${error.message}` };
  }
}

/**
 * Tester la connexion au provider
 */
async function testProviderConnection(configuration: Record<string, any>): Promise<{ success: boolean; message: string }> {
  // Simulation d'un test de connexion
  // Dans un vrai système, on ferait un appel API au provider
  return new Promise((resolve) => {
    setTimeout(() => {
      if (configuration.endpoint && !configuration.endpoint.startsWith('http')) {
        resolve({ success: false, message: "L'endpoint doit être une URL valide (http:// ou https://)" });
        return;
      }
      
      // Validation basique : si on a au moins un credential ou un endpoint, on considère que c'est valide
      const hasCredentials = configuration.apiKey || configuration.apiSecret || configuration.endpoint;
      if (hasCredentials) {
        resolve({ success: true, message: "Connexion testée avec succès" });
      } else {
        resolve({ success: false, message: "Aucun credential fourni" });
      }
    }, 1000);
  });
}

/**
 * Activer les fonctionnalités/capabilities liées à un abonnement dans le système
 */
function activateSubscriptionCapabilities(subscriptionTypeId: string, subscription: ActiveSubscription): string[] {
  const capabilities: string[] = [];
  
  // Mapper les types d'abonnements aux capabilities système
  const capabilityMap: Record<string, string[]> = {
    "cloud-infrastructure": ["infra.scaling", "infra.ha", "infra.backup"],
    "storage-advanced": ["storage.distributed", "storage.versioning", "storage.search"],
    "security-enterprise": ["security.mfa", "security.sso", "security.encryption"],
    "monitoring-advanced": ["monitoring.realtime", "monitoring.alerts", "monitoring.metrics"],
    "backup-recovery": ["backup.automatic", "backup.restore", "backup.retention"],
    "performance-optimization": ["perf.cache", "perf.cdn", "perf.loadbalancing"],
    "api-advanced": ["api.rest", "api.webhooks", "api.versioning"],
    "analytics-advanced": ["analytics.realtime", "analytics.reports", "analytics.insights"],
    "communication-enterprise": ["comm.email", "comm.sms", "comm.push"],
    "documents-advanced": ["docs.ocr", "docs.signature", "docs.workflow"],
    "integrations-hub": ["integrations.connectors", "integrations.sync", "integrations.mapping"],
    "reporting-enterprise": ["reporting.generate", "reporting.schedule", "reporting.export"],
    "workflow-automation": ["workflow.visual", "workflow.automation", "workflow.approval"]
  };
  
  const mappedCapabilities = capabilityMap[subscriptionTypeId] || [];
  capabilities.push(...mappedCapabilities);
  
  // Sauvegarder les capabilities actives dans le système
  try {
    const activeCapabilities = JSON.parse(localStorage.getItem("icontrol_active_capabilities") || "[]") as string[];
    const updatedCapabilities = [...new Set([...activeCapabilities, ...capabilities])];
    localStorage.setItem("icontrol_active_capabilities", JSON.stringify(updatedCapabilities));
  } catch (e) {
    console.error("Erreur lors de la sauvegarde des capabilities:", e);
  }
  
  return capabilities;
}

/**
 * Vérifier si une capability est active dans le système
 */
export function isCapabilityActive(capability: string): boolean {
  try {
    const activeCapabilities = JSON.parse(localStorage.getItem("icontrol_active_capabilities") || "[]") as string[];
    return activeCapabilities.includes(capability);
  } catch {
    return false;
  }
}

/**
 * Analyser tous les abonnements actifs et calculer les capabilities actives
 */
export function analyzeActiveCapabilities(): {
  activeCapabilities: string[];
  capabilitiesBySubscription: Record<string, string[]>;
  subscriptionsByCategory: Record<string, string[]>;
} {
  const activeSubs = getActiveSubscriptions().filter(s => s.status === "active" && s.configuration?._linkedToSystem);
  
  // Mapper les types d'abonnements aux capabilities système
  const capabilityMap: Record<string, string[]> = {
    "cloud-infrastructure": ["infra.scaling", "infra.ha", "infra.backup"],
    "storage-advanced": ["storage.distributed", "storage.versioning", "storage.search"],
    "security-enterprise": ["security.mfa", "security.sso", "security.encryption"],
    "monitoring-advanced": ["monitoring.realtime", "monitoring.alerts", "monitoring.metrics"],
    "backup-recovery": ["backup.automatic", "backup.restore", "backup.retention"],
    "performance-optimization": ["perf.cache", "perf.cdn", "perf.loadbalancing"],
    "api-advanced": ["api.rest", "api.webhooks", "api.versioning"],
    "analytics-advanced": ["analytics.realtime", "analytics.reports", "analytics.insights"],
    "communication-enterprise": ["comm.email", "comm.sms", "comm.push"],
    "documents-advanced": ["docs.ocr", "docs.signature", "docs.workflow"],
    "integrations-hub": ["integrations.connectors", "integrations.sync", "integrations.mapping"],
    "reporting-enterprise": ["reporting.generate", "reporting.schedule", "reporting.export"],
    "workflow-automation": ["workflow.visual", "workflow.automation", "workflow.approval"]
  };
  
  const capabilitiesBySubscription: Record<string, string[]> = {};
  const subscriptionsByCategory: Record<string, string[]> = {};
  const allActiveCapabilities = new Set<string>();
  
  // Analyser chaque abonnement actif
  activeSubs.forEach(sub => {
    const capabilities = capabilityMap[sub.subscriptionTypeId] || [];
    capabilitiesBySubscription[sub.subscriptionTypeId] = capabilities;
    capabilities.forEach(cap => allActiveCapabilities.add(cap));
    
    // Mapper les capabilities aux catégories
    const categoryMap: Record<string, string> = {
      "infra.scaling": "Infrastructure", "infra.ha": "Infrastructure", "infra.backup": "Infrastructure",
      "storage.distributed": "Stockage", "storage.versioning": "Stockage", "storage.search": "Stockage",
      "security.mfa": "Sécurité", "security.sso": "Sécurité", "security.encryption": "Sécurité",
      "monitoring.realtime": "Monitoring", "monitoring.alerts": "Monitoring", "monitoring.metrics": "Monitoring",
      "backup.automatic": "Backup", "backup.restore": "Backup", "backup.retention": "Backup",
      "perf.cache": "Performance", "perf.cdn": "Performance", "perf.loadbalancing": "Performance",
      "api.rest": "API", "api.webhooks": "API", "api.versioning": "API",
      "analytics.realtime": "Analytics", "analytics.reports": "Analytics", "analytics.insights": "Analytics",
      "comm.email": "Communication", "comm.sms": "Communication", "comm.push": "Communication",
      "docs.ocr": "Documents", "docs.signature": "Documents", "docs.workflow": "Documents",
      "integrations.connectors": "Intégrations", "integrations.sync": "Intégrations", "integrations.mapping": "Intégrations",
      "reporting.generate": "Reporting", "reporting.schedule": "Reporting", "reporting.export": "Reporting",
      "workflow.visual": "Workflow", "workflow.automation": "Workflow", "workflow.approval": "Workflow"
    };
    
    capabilities.forEach(cap => {
      const category = categoryMap[cap] || "Autre";
      if (!subscriptionsByCategory[category]) {
        subscriptionsByCategory[category] = [];
      }
      if (!subscriptionsByCategory[category].includes(sub.subscriptionTypeId)) {
        subscriptionsByCategory[category].push(sub.subscriptionTypeId);
      }
    });
  });
  
  return {
    activeCapabilities: Array.from(allActiveCapabilities),
    capabilitiesBySubscription,
    subscriptionsByCategory
  };
}
