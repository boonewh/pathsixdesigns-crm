// CRM Configuration - Dynamic tenant-based configuration from backend
// Config is loaded at login and stored in auth context

import { useAuth } from "@/authContext";

export interface CRMConfig {
  // Company branding
  branding: {
    companyName: string;
    primaryColor: string;
    secondaryColor: string;
    logo?: string | null;        // Full logo URL (null = use default PathSix logo)
    logoCompact?: string | null; // Compact/icon logo URL (null = use default)
  };

  // Entity labels (customize for industry)
  labels: {
    client: string;          // "Client", "Account", "Customer", "Company"
    lead: string;           // "Lead", "Prospect", "Opportunity", "Contact"
    project: string;        // "Project", "Deal", "Opportunity", "Job"
    interaction: string;    // "Interaction", "Activity", "Touch", "Contact"
  };

  // Lead management configuration
  leads: {
    statuses: readonly string[];
    statusConfig: {
      colors: Record<string, string>;
      icons: Record<string, string>;
      labels: Record<string, string>;
    };
    sources: readonly string[];
    temperatures: readonly string[];
    temperatureConfig: {
      colors: Record<string, string>;
      icons: Record<string, string>;
    };
    customFields?: Array<{
      key: string;
      label: string;
      type: 'text' | 'select' | 'number' | 'date';
      options?: string[];
      required?: boolean;
    }>;
  };

  // Industry/business types
  businessTypes: readonly string[];

  // Regional settings
  regional: {
    currency: string;
    currencySymbol: string;
    dateFormat: string;
    phoneFormat: string;
    addressFormat: 'US' | 'UK' | 'EU' | 'INTL';
  };

  // Feature toggles
  features: {
    showTemperature: boolean;
    showLeadScore: boolean;
    showSource: boolean;
    enableProjectStandalone: boolean;
    enableBulkOperations: boolean;
    enableAdvancedFilters: boolean;
    enableDataExport: boolean;
  };

  // Default view preferences
  defaults: {
    leadsPerPage: number;
    clientsPerPage: number;
    projectsPerPage: number;
    defaultView: 'cards' | 'table';
    defaultSort: 'newest' | 'oldest' | 'alphabetical';
  };
}

// Default configuration - used as fallback when tenant config not yet loaded
export const DEFAULT_CONFIG: CRMConfig = {
  branding: {
    companyName: "PathSix CRM",
    primaryColor: "#2563eb",
    secondaryColor: "#64748b",
  },

  labels: {
    client: "Client",
    lead: "Lead",
    project: "Project",
    interaction: "Interaction",
  },

  leads: {
    statuses: ['new', 'contacted', 'qualified', 'lost', 'converted'],
    statusConfig: {
      colors: {
        new: 'bg-yellow-100 text-yellow-800',
        contacted: 'bg-blue-100 text-blue-800',
        qualified: 'bg-orange-100 text-orange-800',
        lost: 'bg-red-100 text-red-800',
        converted: 'bg-green-100 text-green-800'
      },
      icons: {
        new: 'circle-yellow',
        contacted: 'phone',
        qualified: 'circle-orange',
        lost: 'circle-red',
        converted: 'circle-green'
      },
      labels: {
        new: 'New',
        contacted: 'Contacted',
        qualified: 'Qualified',
        lost: 'Lost',
        converted: 'Converted'
      }
    },
    sources: [
      'Website', 'Referral', 'Cold Call', 'Email Campaign',
      'Social Media', 'Trade Show', 'Advertisement', 'Partner', 'Other'
    ],
    temperatures: ['hot', 'warm', 'cold'],
    temperatureConfig: {
      colors: {
        hot: 'text-red-600',
        warm: 'text-orange-600',
        cold: 'text-blue-600'
      },
      icons: {
        hot: 'fire',
        warm: 'sun',
        cold: 'snowflake'
      }
    }
  },

  businessTypes: [
    'None', 'Professional Services', 'Technology', 'Manufacturing',
    'Retail', 'Healthcare', 'Finance', 'Education', 'Other'
  ],

  regional: {
    currency: 'USD',
    currencySymbol: '$',
    dateFormat: 'MM/DD/YYYY',
    phoneFormat: 'US',
    addressFormat: 'US'
  },

  features: {
    showTemperature: true,
    showLeadScore: false,
    showSource: true,
    enableProjectStandalone: true,
    enableBulkOperations: true,
    enableAdvancedFilters: true,
    enableDataExport: true,
  },

  defaults: {
    leadsPerPage: 10,
    clientsPerPage: 10,
    projectsPerPage: 10,
    defaultView: 'cards',
    defaultSort: 'newest',
  }
};

// For backward compatibility - points to default config
// Components should use useCRMConfig() hook instead
export const ACTIVE_CONFIG = DEFAULT_CONFIG;

/**
 * Hook to get current CRM configuration.
 *
 * Returns the tenant-specific config from auth context if logged in,
 * or falls back to DEFAULT_CONFIG if not authenticated.
 *
 * Usage:
 *   const config = useCRMConfig();
 *   const statuses = config.leads.statuses;
 */
export function useCRMConfig(): CRMConfig {
  const { tenant } = useAuth();
  return tenant?.config || DEFAULT_CONFIG;
}

/**
 * Get config outside of React components (for schema validation, etc.)
 * This reads from localStorage directly.
 *
 * Note: Prefer useCRMConfig() in components for reactivity.
 */
export function getStoredConfig(): CRMConfig {
  try {
    const stored = localStorage.getItem("authTenant");
    if (stored) {
      const tenant = JSON.parse(stored);
      return tenant.config || DEFAULT_CONFIG;
    }
  } catch (e) {
    console.warn("Failed to parse stored tenant config");
  }
  return DEFAULT_CONFIG;
}
