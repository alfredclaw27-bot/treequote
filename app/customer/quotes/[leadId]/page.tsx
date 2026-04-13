"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Lead, Quote, Contractor } from "@/types";
import { ArrowLeft, DollarSign, Calendar, MessageSquare, CheckCircle, Clock } from "lucide-react";

export default function CustomerQuotesPage() {
  const params = useParams();
  const leadId = params.leadId as string;
  const supabase = createClient();

  const [lead, setLead] = useState<Lead | null>(null);
  const [quotes, setQuotes] = useState<(Quote & { contractor?: Contractor })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: leadData } = await supabase
        .from("leads")
        .select("*, customer:customers(*)")
        .eq("id", leadId)
        .single();

      if (leadData) {
        setLead(leadData as Lead);

        const { data: quotesData } = await supabase
          .from("quotes")
          .select("*, contractor:contractors(*)")
          .eq("lead_id", leadId)
          .order("amount", { ascending: true });

        if (quotesData) setQuotes(quotesData as (Quote & { contractor?: Contractor })[]);
      }
      setLoading(false);
    };
    load();
  }, [leadId, supabase]);

  const handleAccept = async (quoteId: string) => {
    await supabase.from("quotes").update({ status: "accepted" }).eq("id", quoteId);
    setQuotes((qs) => qs.map((q) => q.id === quoteId ? { ...q, status: "accepted" as const } : q));
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
          <Link href="/" className="text-green-600 font-medium hover:underline">← Back to Home</Link>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <span className="font-bold text-lg text-gray-900">🌳 TreeQuote</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Lead Summary */}
        <Card className="p-5">
          <h1 className="text-xl font-bold text-gray-900 capitalize mb-1">
            {lead.service_types.join(", ")}
          </h1>
          <p className="text-gray-500 text-sm mb-3">{lead.address}</p>
          {lead.photo_url && (
            <img src={lead.photo_url} alt="Tree" className="w-full h-48 object-cover rounded-xl" />
          )}
        </Card>

        {/* AI Analysis Preview */}
        {lead.analysis_data && (
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🤖</span>
              <h2 className="font-semibold text-gray-900">AI Analysis</h2>
              <Badge variant={lead.analysis_data.healthStatus === "healthy" ? "green" : "amber"}>
                {lead.analysis_data.healthStatus}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="text-gray-500">Species:</span> <span className="font-medium capitalize">{lead.analysis_data.species}</span></div>
              <div><span className="text-gray-500">Height:</span> <span className="font-medium">{lead.analysis_data.heightEstimate}</span></div>
            </div>
            {lead.analysis_data.visibleDamage && lead.analysis_data.visibleDamage !== "undetermined" && (
              <p className="text-sm text-gray-500 mt-2">⚠️ {lead.analysis_data.visibleDamage}</p>
            )}
          </Card>
        )}

        {/* Quotes */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 mb-4">
            Quotes {quotes.length > 0 && <span className="text-gray-400 font-normal text-lg">({quotes.length})</span>}
          </h2>

          {quotes.length === 0 ? (
            <Card className="p-8 text-center">
              <Clock size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-1">No quotes yet</p>
              <p className="text-gray-400 text-sm">Contractors are reviewing your request. Quotes typically arrive within 24 hours.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <Card key={quote.id} className="p-5">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-2xl text-gray-900">${quote.amount.toLocaleString()}</p>
                      <p className="text-sm text-gray-500">{quote.contractor?.business_name ?? "Contractor"}</p>
                    </div>
                    <Badge
                      variant={quote.status === "accepted" ? "green" : quote.status === "rejected" ? "red" : "amber"}
                    >
                      {quote.status}
                    </Badge>
                  </div>

                  {quote.notes && (
                    <div className="flex gap-2 mb-3">
                      <MessageSquare size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-600">{quote.notes}</p>
                    </div>
                  )}

                  {quote.estimated_date && (
                    <div className="flex gap-2 mb-4">
                      <Calendar size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-600">
                        Available: {new Date(quote.estimated_date).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {quote.status === "pending" && (
                    <div className="flex gap-3">
                      <Button onClick={() => handleAccept(quote.id)} className="flex-1 gap-2">
                        <CheckCircle size={16} />
                        Accept Quote
                      </Button>
                    </div>
                  )}

                  {quote.status === "accepted" && (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                      <CheckCircle size={20} className="text-green-600" />
                      <div>
                        <p className="font-semibold text-green-800">Quote accepted!</p>
                        <p className="text-sm text-green-600">Contact {quote.contractor?.business_name} to schedule your job.</p>
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-gray-400 mt-3">
                    Received {new Date(quote.created_at).toLocaleDateString()} at {new Date(quote.created_at).toLocaleTimeString()}
                  </p>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Price Context */}
        {lead.analysis_data && (
          <div className="bg-gray-100 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-500">
              AI estimated range for {lead.service_types[0]}:{" "}
              <span className="font-semibold text-gray-700">
                {lead.analysis_data.heightEstimate} trees typically range $500–$4,000 for removal
              </span>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}