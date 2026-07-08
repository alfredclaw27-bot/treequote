import type { Lead, Quote } from "@/types";

/**
 * Demo-mode data — used when a contractor clicks "Explore Demo Account"
 * (no Supabase needed) and as a local fallback in a couple of other spots.
 * Kept generic enough to make sense for any vertical fork.
 */
export const MOCK_LEADS: Lead[] = [
  {
    id: "mock-001",
    customer_id: "c1",
    photo_url: "https://images.unsplash.com/photo-1542556398-95fb5b9f9b48?w=800&q=80",
    analysis_data: null,
    details: { height: "20_40", treeType: "oak", equipmentAccess: "wide_open", urgency: "this_week" },
    service_types: ["removal"],
    address: "142 Peachtree St NE, Atlanta, GA 30303",
    latitude: 33.759,
    longitude: -84.389,
    google_maps_verified: true,
    status: "new",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    customer: { id: "c1", name: "James Whitfield", phone: "(404) 555-0142", email: "james.w@example.com", created_at: new Date().toISOString() },
  },
  {
    id: "mock-002",
    customer_id: "c2",
    photo_url: "https://images.unsplash.com/photo-1567228722940-9a1cf1d0a5b6?w=800&q=80",
    analysis_data: null,
    details: { height: "40_60", treeType: "pine", equipmentAccess: "behind_fence", siteConditions: ["near_fence"], urgency: "this_month" },
    service_types: ["trimming", "removal"],
    address: "789 Oak Valley Dr, Marietta, GA 30060",
    latitude: 33.951,
    longitude: -84.549,
    google_maps_verified: true,
    status: "new",
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    customer: { id: "c2", name: "Priya Natarajan", phone: "(770) 555-0198", email: "priya.n@example.com", created_at: new Date().toISOString() },
  },
  {
    id: "mock-003",
    customer_id: "c3",
    photo_url: "https://images.unsplash.com/photo-1604544201168-2c8b00cc2f90?w=800&q=80",
    analysis_data: null,
    details: { height: "20_40", treeType: "palm", equipmentAccess: "wide_open", urgency: "just_researching" },
    service_types: ["palm"],
    address: "321 Riverside Blvd, Roswell, GA 30075",
    latitude: 34.023,
    longitude: -84.362,
    google_maps_verified: true,
    status: "quoted",
    created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
    customer: { id: "c3", name: "Marcus Lee", phone: "(678) 555-0176", email: "marcus.lee@example.com", created_at: new Date().toISOString() },
  },
  {
    id: "mock-004",
    customer_id: "c4",
    photo_url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=80",
    analysis_data: null,
    details: { height: "20_40", treeType: "maple", siteConditions: ["near_power_lines"], equipmentAccess: "narrow", urgency: "asap" },
    service_types: ["removal"],
    address: "555 Maple Ave, Decatur, GA 30030",
    latitude: 33.775,
    longitude: -84.296,
    google_maps_verified: true,
    status: "new",
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    customer: { id: "c4", name: "Sarah Bellweather", phone: "(404) 555-0133", email: "sarah.b@example.com", created_at: new Date().toISOString() },
  },
  {
    id: "mock-005",
    customer_id: "c5",
    photo_url: "https://images.unsplash.com/photo-1588592802486-c9a77e775933?w=800&q=80",
    analysis_data: null,
    details: { stumpSituation: "has_stump", stumpDiameter: "24_36", equipmentAccess: "wide_open", urgency: "this_week" },
    service_types: ["stump"],
    address: "88 Dogwood Ln, Alpharetta, GA 30009",
    latitude: 34.075,
    longitude: -84.294,
    google_maps_verified: true,
    status: "new",
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    customer: { id: "c5", name: "David Okafor", phone: "(678) 555-0159", email: "david.o@example.com", created_at: new Date().toISOString() },
  },
];

export const MOCK_QUOTES: Quote[] = [
  {
    id: "q-mock-001",
    lead_id: "mock-001",
    contractor_id: "demo-contractor",
    amount: 1800,
    notes: "Standard removal with chipping. Includes stump grinding for $200 extra if needed.",
    estimated_date: "2026-08-20",
    status: "pending",
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "q-mock-002",
    lead_id: "mock-003",
    contractor_id: "demo-contractor",
    amount: 350,
    notes: "Palm cleaning — standard service. Remove all dead fronds and fruit.",
    estimated_date: "2026-08-18",
    status: "accepted",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export function findMockLead(id: string): Lead | undefined {
  return MOCK_LEADS.find((l) => l.id === id);
}
