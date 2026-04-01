"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AnalysisDisplay } from "@/components/AnalysisDisplay";
import { QuoteForm } from "@/components/QuoteForm";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, MapPin, Clock } from "lucide-react";
import type { Lead } from "@/types";
import { LEAD_PRICE_CENTS } from "@/lib/stripe";

const MOCK_LEADS: Record<string, Lead> = {
  "mock-001": {
    id: "mock-001", customer_id: "c1",
    photo_url: "https://images.unsplash.com/photo-1542556398-95fb5b9f9b48?w=800&q=80",
    analysis_data: { species: "Oak", heightEstimate: "30-40 ft", healthStatus: "healthy", visibleDamage: "Minor dead branches in upper canopy", accessNotes: "Clear access from driveway, no fence", seasonIndicators: "Full summer canopy", confidence: 0.85 },
    service_types: ["removal"], address: "142 Peachtree St NE, Atlanta, GA 30303",
    status: "new", google_maps_verified: true, created_at: new Date().toISOString(),
  },
  "mock-002": {
    id: "mock-002", customer_id: "c2",
    photo_url: "https://images.unsplash.com/photo-1567228722940-5aterwed6o0e?w=800&q=80",
    analysis_data: { species: "Pine", heightEstimate: "40-50 ft", healthStatus: "stressed", visibleDamage: "Brown patches, possible bark beetle activity", accessNotes: "Backyard with 6ft fence, limited equipment access", seasonIndicators: "Mild stress indicators", confidence: 0.72 },
    service_types: ["trimming", "removal"], address: "789 Oak Valley Dr, Marietta, GA 30060",
    status: "new", google_maps_verified: true, created_at: new Date().toISOString(),
  },
  "mock-003": {
    id: "mock-003", customer_id: "c3",
    photo_url: "https://images.unsplash.com/photo-1604544201168-2c8b00cc2f90?w=800&q=80",
    analysis_data: { species: "Palm", heightEstimate: "20-25 ft", healthStatus: "healthy", visibleDamage: "None", accessNotes: "Open front yard, easy access", seasonIndicators: "Year-round green", confidence: 0.9 },
    service_types: ["palm"], address: "321 Riverside Blvd, Roswell, GA 30075",
    status: "quoted", google_maps_verified: true, created_at: new Date().toISOString(),
  },
  "mock-004": {
    id: "mock-004", customer_id: "c4",
    photo_url: "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=800&q=80",
    analysis_data: { species: "Maple", heightEstimate: "25-35 ft", healthStatus: "hazardous", visibleDamage: "Large crack in main trunk, lean toward house", accessNotes: "Near power lines — extra caution required", seasonIndicators: "Late summer", confidence: 0.78 },
    service_types: ["removal"], address: "555 Maple Ave, Decatur, GA 30030",
    status: "new", google_maps_verified: true, created_at: new Date().toISOString(),
  },
  "mock-005": {
    id: "mock-005", customer_id: "c5",
    photo_url: "https://images.unsplash.com/photo-1588592802486-c9a77e775933?w=800&q=80",
    analysis_data: { species: "Stump (Unknown)", heightEstimate: "Stump ~3ft above ground", healthStatus: "dead", visibleDamage: "Previous removal — stump remains", accessNotes: "Open yard, easy access for grinder", seasonIndicators: "N/A", confidence: 0.95 },
    service_types: ["stump"], address: "88 Dogwood Ln, Alpharetta, GA 30009",
    status: "new", google_maps_verified: true, created_at: new Date().toISOString(),
  },
};

export default function QuotePage() {
  const params = useParams();
  const router = useRouter();
  const leadId = params.leadId as string;
  const supabase = createClient();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getLead = async () => {
      // Try mock first
      const mockLead = MOCK_LEADS[leadId];
      if (mockLead) {
        setLead(mockLead);
        setLoading(false);
        return;
      }

      // Try real Supabase
      const { data } = await supabase
        .from("leads")
        .select("*, customer:customers(*)")
        .eq("id", leadId)
        .single();

      if (data) setLead(data as Lead);
      setLoading(false);
    };
    getLead();
  }, [leadId, supabase]);

  const handleSubmitQuote = async ({ amount, notes, estimatedDate }: { amount: number; notes: string; estimatedDate: string }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/contractor/login");
      return;
    }

    const { error } = await supabase.from("quotes").insert({
      lead_id: leadId,
      contractor_id: user.id,
      amount,
      notes,
      estimated_date: estimatedDate || null,
      status: "pending",
    });

    if (error) throw error;

    // Update lead status
    await supabase.from("leads").update({ status: "quoted" }).eq("id", leadId);

    router.push("/contractor/dashboard?tab=quotes");
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </main>
    );
  }

  if (!lead) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="p-8 text-center">
          <p className="text-gray-500 mb-4">Lead not found.</p>
          <Link href="/contractor/dashboard" className="text-green-600 font-medium hover:underline">← Back to Dashboard</Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/contractor/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <span className="font-bold text-lg text-gray-900">🌳 TreeQuote</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Lead Photo */}
        {lead.photo_url && (
          <img
            src={lead.photo_url}
            alt="Tree"
            className="w-full h-64 object-cover rounded-2xl mb-6"
          />
        )}

        {/* Lead Summary */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 capitalize mb-1">
              {lead.service_types.join(", ")}
            </h1>
            <p className="text-gray-500 flex items-center gap-1 text-sm">
              <MapPin size={14} /> {lead.address}
            </p>
            <p className="text-gray-400 flex items-center gap-1 text-xs mt-1">
              <Clock size={12} /> {new Date(lead.created_at).toLocaleDateString()}
            </p>
          </div>
          <Badge variant={lead.status === "new" ? "green" : "blue"}>{lead.status}</Badge>
        </div>

        {/* AI Analysis */}
        {lead.analysis_data && (
          <div className="mb-6">
            <AnalysisDisplay data={lead.analysis_data} />
          </div>
        )}

        {/* Quote Form */}
        <QuoteForm
          lead={lead}
          onSubmit={handleSubmitQuote}
          priceCents={LEAD_PRICE_CENTS}
        />
      </div>
    </main>
  );
}
