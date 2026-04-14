"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LeadCard } from "@/components/LeadCard";
import { Input } from "@/components/ui/Input";
import type { Lead, Quote } from "@/types";
import { LayoutDashboard, MessageSquare, User, LogOut, DollarSign } from "lucide-react";

// Mock seed data for leads (since customers haven't submitted yet)
const MOCK_LEADS: Lead[] = [
  {
    id: "mock-001",
    customer_id: "c1",
    photo_url: "https://images.unsplash.com/photo-1542556398-95fb5b9f9b48?w=400&q=80",
    analysis_data: {
      species: "Oak",
      heightEstimate: "30-40 ft",
      healthStatus: "healthy",
      visibleDamage: "Minor dead branches in upper canopy",
      accessNotes: "Clear access from driveway, no fence",
      seasonIndicators: "Full summer canopy",
      confidence: 0.85,
    },
    service_types: ["removal"],
    address: "142 Peachtree St NE, Atlanta, GA 30303",
    latitude: 33.759,
    longitude: -84.389,
    google_maps_verified: true,
    status: "new",
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    estimated_price: { low: 1275, high: 1950, currency: "USD", priceFactors: ["Large Oak, 30-40ft", "Clear access from driveway"] },
  },
  {
    id: "mock-002",
    customer_id: "c2",
    photo_url: "https://images.unsplash.com/photo-1567228722940-5aterwed6o0e?w=400&q=80",
    analysis_data: {
      species: "Pine",
      heightEstimate: "40-50 ft",
      healthStatus: "stressed",
      visibleDamage: "Brown patches, possible bark beetle activity",
      accessNotes: "Backyard with 6ft fence, limited equipment access",
      seasonIndicators: "Mild stress indicators, not dormant",
      confidence: 0.72,
    },
    service_types: ["trimming", "removal"],
    address: "789 Oak Valley Dr, Marietta, GA 30060",
    latitude: 33.951,
    longitude: -84.549,
    google_maps_verified: true,
    status: "new",
    created_at: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-003",
    customer_id: "c3",
    photo_url: "https://images.unsplash.com/photo-1604544201168-2c8b00cc2f90?w=400&q=80",
    analysis_data: {
      species: "Palm",
      heightEstimate: "20-25 ft",
      healthStatus: "healthy",
      visibleDamage: "None visible",
      accessNotes: "Open front yard, easy access",
      seasonIndicators: "Year-round green",
      confidence: 0.9,
    },
    service_types: ["palm"],
    address: "321 Riverside Blvd, Roswell, GA 30075",
    latitude: 34.023,
    longitude: -84.362,
    google_maps_verified: true,
    status: "quoted",
    created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-004",
    customer_id: "c4",
    photo_url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=400&q=80",
    analysis_data: {
      species: "Maple",
      heightEstimate: "25-35 ft",
      healthStatus: "hazardous",
      visibleDamage: "Large crack in main trunk, lean toward house",
      accessNotes: "Near power lines — extra caution required",
      seasonIndicators: "Late summer, full canopy",
      confidence: 0.78,
    },
    service_types: ["removal"],
    address: "555 Maple Ave, Decatur, GA 30030",
    latitude: 33.775,
    longitude: -84.296,
    google_maps_verified: true,
    status: "new",
    created_at: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: "mock-005",
    customer_id: "c5",
    photo_url: "https://images.unsplash.com/photo-1588592802486-c9a77e775933?w=400&q=80",
    analysis_data: {
      species: "Stump (Unknown tree)",
      heightEstimate: "Stump ~3ft above ground",
      healthStatus: "dead",
      visibleDamage: "Previous removal — stump remains",
      accessNotes: "Open yard, easy access for grinder",
      seasonIndicators: "N/A — stump only",
      confidence: 0.95,
    },
    service_types: ["stump"],
    address: "88 Dogwood Ln, Alpharetta, GA 30009",
    latitude: 34.075,
    longitude: -84.294,
    google_maps_verified: true,
    status: "new",
    created_at: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
  },
];

// Mock quotes for demo mode
const MOCK_QUOTES: Quote[] = [
  {
    id: "q-mock-001",
    lead_id: "mock-001",
    contractor_id: "demo-contractor",
    amount: 1800,
    notes: "Standard removal with chipping. Includes stump grinding for $200 extra if needed.",
    estimated_date: "2026-04-20",
    status: "pending",
    created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
  },
  {
    id: "q-mock-002",
    lead_id: "mock-003",
    contractor_id: "demo-contractor",
    amount: 350,
    notes: "Palm cleaning — standard service. Remove all dead fronds and fruit.",
    estimated_date: "2026-04-18",
    status: "accepted",
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

type Tab = "leads" | "quotes" | "account";

export default function ContractorDashboardPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("leads");
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS);
  const [quotes, setQuotes] = useState<Quote[]>(MOCK_QUOTES);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<{ email?: string; business_name?: string } | null>(null);

  useEffect(() => {
    const getUser = async () => {
      // Check for demo mode cookie
      const isDemo = document.cookie.includes("treequote_demo=contractor");

      if (!isDemo) {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
          window.location.href = "/contractor/login";
          return;
        }
        setUser({ email: authUser.email });

        // Fetch real leads from Supabase
        const { data: realLeads } = await supabase
          .from("leads")
          .select("*, customer:customers(*)")
          .order("created_at", { ascending: false })
          .limit(20);

        if (realLeads && realLeads.length > 0) {
          setLeads(realLeads as Lead[]);
        }

        // Fetch quotes
        const { data: realQuotes } = await supabase
          .from("quotes")
          .select("*, lead:leads(*)")
          .eq("contractor_id", authUser.id)
          .order("created_at", { ascending: false });

        if (realQuotes) {
          setQuotes(realQuotes as Quote[]);
        }
      } else {
        // Demo mode: use mock user, mock leads, and mock quotes
        setUser({ email: "demo@treequote.com", business_name: "🌲 Atlanta Tree Pro (Demo)" });
      }
      setLoading(false);
    };
    getUser();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/contractor/login";
  };

  const tabs = [
    { id: "leads" as Tab, label: "Leads", icon: LayoutDashboard, count: leads.filter(l => l.status === "new").length },
    { id: "quotes" as Tab, label: "My Quotes", icon: MessageSquare, count: quotes.length },
    { id: "account" as Tab, label: "Account", icon: User, count: null },
  ];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌳</span>
            <div>
              <span className="font-bold text-lg text-gray-900">TreeQuote</span>
              <p className="text-xs text-gray-500">{user?.email ?? "Contractor"}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={16} className="mr-1" /> Logout
          </Button>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-4xl mx-auto flex">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors ${
                tab === id ? "border-green-600 text-green-600" : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              <Icon size={18} />
              {label}
              {count !== null && count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${tab === id ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Leads Tab */}
        {tab === "leads" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Available Leads</h2>
                <p className="text-sm text-gray-500">{leads.length} leads in your area</p>
              </div>
              <Badge variant="amber">${(1000 / 100).toFixed(2)} / lead</Badge>
            </div>

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4 h-32 animate-pulse bg-gray-100" />
                ))}
              </div>
            ) : (
              leads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  showQuoteButton={lead.status === "new"}
                  onQuote={() => window.location.href = `/contractor/quote/${lead.id}`}
                />
              ))
            )}

            {leads.length === 0 && !loading && (
              <Card className="p-12 text-center">
                <p className="text-gray-400 text-lg mb-2">No leads yet</p>
                <p className="text-gray-400 text-sm">Check back soon — customers are submitting requests daily.</p>
              </Card>
            )}
          </div>
        )}

        {/* Quotes Tab */}
        {tab === "quotes" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900">My Quotes</h2>
            {quotes.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-gray-400 text-lg mb-2">No quotes submitted yet</p>
                <p className="text-gray-400 text-sm">Quote a lead to see it here.</p>
              </Card>
            ) : (
              quotes.map((quote) => (
                <Card key={quote.id} className="p-5">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={quote.status === "pending" ? "amber" : quote.status === "accepted" ? "green" : "gray"}>
                      {quote.status}
                    </Badge>
                    <span className="font-bold text-lg text-gray-900">${quote.amount}</span>
                  </div>
                  {quote.lead && (
                    <p className="text-sm text-gray-500 capitalize">
                      {quote.lead.service_types?.join(", ")} · {quote.lead.address}
                    </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">
                    Submitted {new Date(quote.created_at).toLocaleDateString()}
                  </p>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Account Tab */}
        {tab === "account" && (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900">Account</h2>
            <Card className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center text-2xl">🏢</div>
                <div>
                  <p className="font-bold text-gray-900">{user?.business_name ?? "Your Business"}</p>
                  <p className="text-sm text-gray-500">{user?.email}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4">
              <h3 className="font-semibold text-gray-900">Billing</h3>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <DollarSign className="text-gray-400" size={24} />
                <div>
                  <p className="font-medium text-gray-900">Lead Access Fee</p>
                  <p className="text-sm text-gray-500">$10.00 per lead (Stripe)</p>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Stripe integration coming soon. For now, contact mike@mtkinnovations.com to pay for lead access.
              </p>
            </Card>

            <Button variant="secondary" className="w-full" onClick={handleLogout}>
              <LogOut size={16} className="mr-2" /> Sign Out
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}
