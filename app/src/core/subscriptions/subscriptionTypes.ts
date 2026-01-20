/**
 * ICONTROL_SUBSCRIPTION_TYPES_V1
 * Types d'abonnements disponibles pour améliorer le système
 */

export type SubscriptionCategory = "core" | "application";

export type SubscriptionStatus = "active" | "inactive" | "expired" | "pending";

export interface SubscriptionType {
  id: string;
  name: string;
  category: SubscriptionCategory;
  description: string;
  benefits: string[];
  icon: string;
  coreSystemBenefits?: string[]; // Bénéfices pour le cœur du système
  applicationBenefits?: string[]; // Bénéfices pour les applications
}

export const SUBSCRIPTION_TYPES: SubscriptionType[] = [
  // CŒUR DU SYSTÈME - Cloud & Infrastructure
  {
    id: "cloud-infrastructure",
    name: "Infrastructure Cloud",
    category: "core",
    description: "Hébergement cloud scalable avec haute disponibilité et redondance",
    icon: "☁️",
    coreSystemBenefits: [
      "Hébergement cloud scalable",
      "Haute disponibilité (99.9% SLA)",
      "Redondance automatique",
      "Backup automatique quotidien",
      "Monitoring infrastructure 24/7",
      "Support technique prioritaire"
    ],
    applicationBenefits: [
      "Déploiement automatique",
      "Scaling automatique selon la charge",
      "CDN global pour performance",
      "SSL/TLS automatique"
    ]
  },
  
  // CŒUR DU SYSTÈME - Stockage
  {
    id: "storage-advanced",
    name: "Stockage Avancé",
    category: "core",
    description: "Stockage distribué avec réplication et sauvegarde automatique",
    icon: "💾",
    coreSystemBenefits: [
      "Stockage distribué et répliqué",
      "Sauvegarde automatique horaire",
      "Restauration point-in-time",
      "Chiffrement au repos",
      "Quotas configurables par tenant",
      "Archivage automatique"
    ],
    applicationBenefits: [
      "Stockage illimité pour documents",
      "Versioning automatique",
      "Recherche full-text indexée",
      "Accès API haute performance"
    ]
  },
  
  // CŒUR DU SYSTÈME - Sécurité
  {
    id: "security-enterprise",
    name: "Sécurité Entreprise",
    category: "core",
    description: "Protection avancée avec monitoring sécurité et conformité",
    icon: "🔒",
    coreSystemBenefits: [
      "Authentification multi-facteurs (MFA)",
      "SSO (Single Sign-On)",
      "Chiffrement end-to-end",
      "Détection d'intrusion en temps réel",
      "Audit de sécurité complet",
      "Conformité RGPD/SOC2"
    ],
    applicationBenefits: [
      "Protection contre les attaques",
      "Gestion des permissions granulaires",
      "Logs de sécurité détaillés",
      "Alertes sécurité automatiques"
    ]
  },
  
  // CŒUR DU SYSTÈME - Monitoring
  {
    id: "monitoring-advanced",
    name: "Monitoring Avancé",
    category: "core",
    description: "Surveillance système complète avec alertes et métriques",
    icon: "📊",
    coreSystemBenefits: [
      "Monitoring temps réel 24/7",
      "Métriques système détaillées",
      "Alertes configurables",
      "Dashboards personnalisables",
      "Analyse de performance",
      "Prédiction de pannes"
    ],
    applicationBenefits: [
      "Monitoring des performances applicatives",
      "Tracing des requêtes",
      "Analyse des erreurs",
      "Rapports de performance"
    ]
  },
  
  // CŒUR DU SYSTÈME - Backup & Recovery
  {
    id: "backup-recovery",
    name: "Sauvegarde & Récupération",
    category: "core",
    description: "Système de sauvegarde automatique avec récupération rapide",
    icon: "💿",
    coreSystemBenefits: [
      "Sauvegarde automatique horaire",
      "Rétention configurable (30-365 jours)",
      "Récupération point-in-time",
      "Récupération complète en < 1h",
      "Test de restauration mensuel",
      "Stockage hors-site sécurisé"
    ],
    applicationBenefits: [
      "Sauvegarde des données utilisateurs",
      "Restauration sélective",
      "Export de données",
      "Historique des modifications"
    ]
  },
  
  // CŒUR DU SYSTÈME - Performance
  {
    id: "performance-optimization",
    name: "Optimisation Performance",
    category: "core",
    description: "Optimisation des performances système et cache avancé",
    icon: "⚡",
    coreSystemBenefits: [
      "Cache distribué multi-niveaux",
      "Optimisation des requêtes",
      "Compression automatique",
      "CDN global",
      "Load balancing intelligent",
      "Auto-scaling basé sur la charge"
    ],
    applicationBenefits: [
      "Temps de réponse < 100ms",
      "Cache applicatif avancé",
      "Optimisation des assets",
      "Lazy loading intelligent"
    ]
  },
  
  // APPLICATIONS - API & Intégrations
  {
    id: "api-advanced",
    name: "API Avancée",
    category: "application",
    description: "API RESTful complète avec webhooks et intégrations",
    icon: "🔌",
    coreSystemBenefits: [
      "API RESTful complète",
      "Webhooks configurables",
      "Rate limiting intelligent",
      "Documentation API interactive",
      "Versioning API",
      "Authentification OAuth2"
    ],
    applicationBenefits: [
      "Intégrations tierces",
      "Synchronisation de données",
      "Automatisation des workflows",
      "Connecteurs pré-construits"
    ]
  },
  
  // APPLICATIONS - Analytics
  {
    id: "analytics-advanced",
    name: "Analytics Avancé",
    category: "application",
    description: "Analyse de données avec rapports personnalisés et insights",
    icon: "📈",
    coreSystemBenefits: [
      "Analytics en temps réel",
      "Rapports personnalisables",
      "Export de données",
      "Visualisations interactives",
      "Prédictions basées sur ML",
      "Alertes basées sur seuils"
    ],
    applicationBenefits: [
      "Tableaux de bord personnalisés",
      "Analyse des tendances",
      "Rapports automatisés",
      "Insights business"
    ]
  },
  
  // APPLICATIONS - Communication
  {
    id: "communication-enterprise",
    name: "Communication Entreprise",
    category: "application",
    description: "Système de communication intégré avec notifications",
    icon: "📧",
    coreSystemBenefits: [
      "Notifications multi-canaux",
      "Email transactionnel",
      "SMS/WhatsApp intégré",
      "Notifications push",
      "Templates personnalisables",
      "Suivi de livraison"
    ],
    applicationBenefits: [
      "Notifications utilisateurs",
      "Alertes automatiques",
      "Campagnes marketing",
      "Communication client"
    ]
  },
  
  // APPLICATIONS - Documents
  {
    id: "documents-advanced",
    name: "Gestion Documents Avancée",
    category: "application",
    description: "Gestion documentaire avec OCR et signature électronique",
    icon: "📄",
    coreSystemBenefits: [
      "OCR multi-langues",
      "Signature électronique",
      "Versioning automatique",
      "Workflow d'approbation",
      "Recherche full-text",
      "Archivage automatique"
    ],
    applicationBenefits: [
      "Gestion documentaire complète",
      "Traitement automatique",
      "Collaboration en temps réel",
      "Conformité documentaire"
    ]
  },
  
  // APPLICATIONS - Intégrations
  {
    id: "integrations-hub",
    name: "Hub d'Intégrations",
    category: "application",
    description: "Connecteurs vers services externes et synchronisation",
    icon: "🔗",
    coreSystemBenefits: [
      "Connecteurs pré-construits",
      "Synchronisation bidirectionnelle",
      "Mapping de données",
      "Transformation de données",
      "Gestion des erreurs",
      "Monitoring des intégrations"
    ],
    applicationBenefits: [
      "Intégration CRM/ERP",
      "Synchronisation comptable",
      "Intégration e-commerce",
      "Connecteurs API tiers"
    ]
  },
  
  // APPLICATIONS - Reporting
  {
    id: "reporting-enterprise",
    name: "Reporting Entreprise",
    category: "application",
    description: "Génération de rapports avancés avec planification",
    icon: "📋",
    coreSystemBenefits: [
      "Génération de rapports",
      "Templates personnalisables",
      "Planification automatique",
      "Export multi-formats",
      "Distribution automatique",
      "Rapports interactifs"
    ],
    applicationBenefits: [
      "Rapports financiers",
      "Rapports opérationnels",
      "Tableaux de bord",
      "Analyses personnalisées"
    ]
  },
  
  // APPLICATIONS - Workflow
  {
    id: "workflow-automation",
    name: "Automatisation Workflow",
    category: "application",
    description: "Automatisation des processus métier avec workflows",
    icon: "⚙️",
    coreSystemBenefits: [
      "Workflows visuels",
      "Règles métier configurables",
      "Automatisation des tâches",
      "Notifications automatiques",
      "Gestion des approbations",
      "Historique des workflows"
    ],
    applicationBenefits: [
      "Automatisation des processus",
      "Workflows personnalisés",
      "Intégration avec applications",
      "Optimisation des opérations"
    ]
  }
];

export function getSubscriptionType(id: string): SubscriptionType | undefined {
  return SUBSCRIPTION_TYPES.find(st => st.id === id);
}

export function getSubscriptionsByCategory(category: SubscriptionCategory): SubscriptionType[] {
  return SUBSCRIPTION_TYPES.filter(st => st.category === category);
}
