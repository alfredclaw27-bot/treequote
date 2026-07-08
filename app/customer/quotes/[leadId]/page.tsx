"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AnalysisDisplay } from "@/components/AnalysisDisplay";
import type { Lead, Quote, Contractor } from "@/types";
import { ArrowLeft, Calendar, MessageSquare, CheckCircle, Clock } from "lucide-react";
import { siteConfig } from "@/config/site";
import { formatDetailsSummary } from "@/lib/details";
import { findMockLead } from "@/lib/mock-data";
import { findDemoLead, getDemoQuotes } from "@/lib/demo";

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
        .from("tq_leads")
        .select("*, customer:tq_customers(*)")
        .eq("id", leadId)
        .single();

      if (leadData) {
        setLead(leadData as Lead);

        const { data: quotesData } = await supabase
          .from("tq_quotes")
          .select("*, contractor:tq_contractors(*)")
          .eq("lead_id", leadId)
          .order("amount", { ascending: true });

        if (quotesData) setQuotes(quotesData as (Quote & { contractor?: Contractor })[]);
      } else {
        // Fall back to demo/mock lead so the confirmation link always works
        const mockLead = findMockLead(leadId) ?? (findDemoLead(leadId) as unknown as Lead | undefined);
        if (mockLead) setLead(mockLead);
        const demoQuotes = getDemoQuotes().filter((q) => q.lead_id === leadId);
        if (demoQuotes.length > 0) setQuotes(demoQuotes as unknown as (Quote & { contractor?: Contractor })[]);
      }
      setLoading(false);
    };
    load();
  }, [leadId, supabase]);

  const handleAccept = async (quoteId: string) => {
    await supabase.from("tq_quotes").update({ status: "accepted" }).eq("id", quoteId);
    setQuotes((qs) => qs.map((q) => (q.id === quoteId ? { ...q, status: "accepted" as const } : q)));
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </main>
    );
  }

  if (!lead) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="p-8 text-center dark:bg-gray-800 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 mb-4">Lead not found.</p>
          <Link href="/" className="text-primary font-medium hover:underline">← Back to Home</Link>
        </Card>
      </main>
    );
  }

  const serviceLabels = (lead.service_types ?? [])
    .map((id) => siteConfig.serviceTypes.find((s) => s.id === id)?.label ?? id)
    .join(", ");

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <ArrowLeft size={20} />
          </Link>
          <span className="font-bold text-lg text-gray-900 dark:text-white">{siteConfig.brand.emoji} {siteConfig.brand.name}</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        {/* Lead Summary */}
        <Card className="p-5 dark:bg-gray-800 dark:border-gray-700">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{serviceLabels}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-3">{lead.address}</p>
          {lead.photo_url && (
            <img src={lead.photo_url} alt="Job" className="w-full h-48 object-cover rounded-xl" />
          )}
        </Card>

        {/* Job Details */}
        {lead.details && formatDetailsSummary(lead.details).length > 0 && (
          <Card className="p-5 dark:bg-gray-800 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white mb-2">Your Request Details</h2>
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
              {formatDetailsSummary(lead.details).map((line) => <li key={line}>{line}</li>)}
            </ul>
          </Card>
        )}

        {siteConfig.features.aiAnalysis && lead.analysis_data && (
          <AnalysisDisplay data={lead.analysis_data} />
        )}

        {/* Quotes */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Quotes {quotes.length > 0 && <span className="text-gray-400 font-normal text-lg">({quotes.length})</span>}
          </h2>

          {quotes.length === 0 ? (
            <Card className="p-8 text-center dark:bg-gray-800 dark:border-gray-700">
              <Clock size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400 mb-1">No quotes yet</p>
              <p className="text-gray-400 text-sm">Contractors are reviewing your request. Quotes typically arrive within 24 hours.</p>
            </Card>
          ) : (
            <div className="space-y-4">
              {quotes.map((quote) => (
                <Card key={quote.id} className="p-5 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-2xl text-gray-900 dark:text-white">${quote.amount.toLocaleString()}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{quote.contractor?.business_name ?? "Contractor"}</p>
                    </div>
                    <Badge variant={quote.status === "accepted" ? "green" : quote.status === "rejected" ? "red" : "amber"}>
                      {quote.status}
                    </Badge>
                  </div>

                  {quote.notes && (
                    <div className="flex gap-2 mb-3">
                      <MessageSquare size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-600 dark:text-gray-300">{quote.notes}</p>
                    </div>
                  )}

                  {quote.estimated_date && (
                    <div className="flex gap-2 mb-4">
                      <Calendar size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-600 dark:text-gray-300">
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
                    <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-3">
                      <CheckCircle size={20} className="text-primary" />
                      <div>
                        <p className="font-semibold text-primary-dark dark:text-primary">Quote accepted!</p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">Contact {quote.contractor?.business_name} to schedule your job.</p>
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
      </div>
    </main>
  );
}
