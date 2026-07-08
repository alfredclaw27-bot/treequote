export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  created_at: string;
}

/** Freeform answers keyed by config.detailFields[].key */
export type LeadDetails = Record<string, string | boolean | string[] | undefined>;

export interface Lead {
  id: string;
  customer_id: string;
  photo_url: string;
  photo_urls?: string[];
  details?: LeadDetails;
  analysis_data: AnalysisData | null;
  estimated_price?: EstimatedPrice;
  service_types: string[];
  address: string;
  latitude?: number;
  longitude?: number;
  google_maps_verified: boolean;
  status: "new" | "quoted" | "closed";
  stripe_payment_id?: string;
  notifications_sent?: number;
  notification_targets?: string[];
  created_at: string;
  customer?: Customer;
  /** Populated client-side for contractor views: has the current contractor unlocked this lead? */
  unlocked?: boolean;
  /** How many contractors have already unlocked this lead */
  unlock_count?: number;
  /** True when `unlock_count >= maxContractorsPerLead` */
  is_full?: boolean;
}

export interface AnalysisData {
  species: string;
  heightEstimate: string;
  healthStatus: string;
  visibleDamage: string;
  accessNotes: string;
  seasonIndicators: string;
  confidence: number;
  obstacles?: string[];
  estimatedJobComplexity?: string;
}

export interface EstimatedPrice {
  low: number;
  high: number;
  currency: "USD";
  priceFactors: string[];
}

export interface Contractor {
  id: string;
  email: string;
  business_name: string;
  phone?: string;
  service_area: string[];
  specialties: string[];
  approved: boolean;
  stripe_customer_id?: string;
  lead_credits: number;
  is_founding: boolean;
  created_at: string;
}

export interface Quote {
  id: string;
  lead_id: string;
  contractor_id: string;
  amount: number;
  notes?: string;
  estimated_date?: string;
  status: "pending" | "accepted" | "rejected";
  stripe_payment_id?: string;
  created_at: string;
  lead?: Lead;
  contractor?: Contractor;
}

export interface LeadAccess {
  id: string;
  lead_id: string;
  contractor_id: string;
  payment_status: "pending" | "completed";
  unlock_method?: "stripe" | "credit";
  stripe_session_id?: string;
  stripe_payment_id?: string;
  created_at: string;
}
