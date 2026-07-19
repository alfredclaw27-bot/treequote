export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  /** Linked Supabase Auth user, once the customer creates an account. */
  auth_user_id?: string | null;
  created_at: string;
}

/** Freeform answers keyed by config.detailFields[].key */
export type LeadDetails = Record<string, string | boolean | string[] | undefined>;

export interface Lead {
  id: string;
  customer_id: string;
  photo_url: string;
  photo_urls?: string[];
  /** Total photos submitted — set in demo mode when only a thumbnail (not every photo) is persisted to localStorage. */
  photo_count?: number;
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

/** A single field-level change captured on a lead 'edit' event. */
export interface LeadEventChange {
  /** Key the change applies to — a detailFields[].key, or "service_types" */
  field: string;
  /** Human-readable label for the field, e.g. "Tree height" */
  label: string;
  /** Human-readable previous value, e.g. "20–40 ft" ("—" when empty) */
  old: string;
  /** Human-readable new value, e.g. "Over 60 ft" ("—" when empty) */
  new: string;
}

/**
 * A tracked event on a lead's timeline — either a free-text comment or a
 * recorded edit (with a field-by-field diff). Written by the customer today;
 * `actor`/`type` leave room for contractor/admin comments later.
 */
export interface LeadEvent {
  id: string;
  lead_id: string;
  actor: "customer" | "contractor" | "admin";
  type: "comment" | "edit";
  /** Comment text — set when type === "comment" */
  body?: string | null;
  /** Field diff — set when type === "edit" */
  changes?: LeadEventChange[] | null;
  created_at: string;
}
