export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  created_at: string;
}

export interface Lead {
  id: string;
  customer_id: string;
  photo_url: string;
  analysis_data: AnalysisData | null;
  estimated_price?: EstimatedPrice;
  service_types: string[];
  address: string;
  latitude?: number;
  longitude?: number;
  google_maps_verified: boolean;
  status: "new" | "quoted" | "closed";
  stripe_payment_id?: string;
  created_at: string;
  customer?: Customer;
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

export const SERVICE_TYPES = [
  { id: "removal", label: "Tree Removal", icon: "🪓" },
  { id: "trimming", label: "Trimming / Pruning", icon: "✂️" },
  { id: "stump", label: "Stump Grinding", icon: "⚙️" },
  { id: "palm", label: "Palm Cleaning", icon: "🌴" },
  { id: "other", label: "Other", icon: "❓" },
];
