"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { AnalysisDisplay } from "@/components/AnalysisDisplay";
import type { Lead, Quote, Contractor, LeadEvent, LeadDetails } from "@/types";
import { ArrowLeft, Calendar, MessageSquare, CheckCircle, Clock, Pencil, History } from "lucide-react";
import { siteConfig } from "@/config/site";
import { formatDetailsSummary } from "@/lib/details";
import { formatChangeLine, buildLeadEditChanges } from "@/lib/lead-events";
import { findMockLead } from "@/lib/mock-data";
import { findDemoLead, getDemoQuotes, getDemoLeadEvents, saveDemoLeadEvent, updateDemoLead } from "@/lib/demo";
import { EditRequestForm } from "./EditRequestForm";

export default function CustomerQuotesPage() {
  const params = useParams();
  const leadId = params.leadId as string;
  const supabase = createClient();

  const [lead, setLead] = useState<Lead | null>(null);
  const [quotes, setQuotes] = useState<(Quote & { contractor?: Contractor })[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  // Updates & comments timeline (tq_lead_events) — see lib/lead-events.ts
  const [events, setEvents] = useState<LeadEvent[]>([]);
  const [comment, setComment] = useState("");
  const [postingComment, setPostingComment] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [editing, setEditing] = useState(false);

  const loadEvents = async (currentLeadId: string, demo: boolean) => {
    if (demo) {
      const demoEvents = getDemoLeadEvents(currentLeadId) as unknown as LeadEvent[];
      setEvents(demoEvents);
      return;
    }
    try {
      const res = await fetch(`/api/leads/${currentLeadId}/events`);
      if (!res.ok) return;
      const data = await res.json();
      setEvents((data.events ?? []) as LeadEvent[]);
    } catch (e) {
      console.error("Failed to load lead events:", e);
    }
  };

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
        await loadEvents(leadId, false);
      } else {
        // Fall back to demo/mock lead so the confirmation link always works
        setIsDemo(true);
        const mockLead = findMockLead(leadId) ?? (findDemoLead(leadId) as unknown as Lead | undefined);
        if (mockLead) setLead(mockLead);
        const demoQuotes = getDemoQuotes().filter((q) => q.lead_id === leadId);
        if (demoQuotes.length > 0) setQuotes(demoQuotes as unknown as (Quote & { contractor?: Contractor })[]);
        await loadEvents(leadId, true);
      }
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId, supabase]);

  const handlePostComment = async () => {
    const body = comment.trim();
    if (!body) return;
    setCommentError("");
    setPostingComment(true);
    try {
      if (isDemo) {
        const event: LeadEvent = {
          id: `demo-event-${Date.now().toString(36)}`,
          lead_id: leadId,
          actor: "customer",
          type: "comment",
          body,
          created_at: new Date().toISOString(),
        };
        saveDemoLeadEvent(event as unknown as Record<string, unknown>);
        setEvents((prev) => [...prev, event]);
      } else {
        const res = await fetch(`/api/leads/${leadId}/events`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ body }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to add comment");
        setEvents((prev) => [...prev, data.event as LeadEvent]);
      }
      setComment("");
    } catch (e) {
      setCommentError(e instanceof Error ? e.message : "Failed to add comment. Please try again.");
    } finally {
      setPostingComment(false);
    }
  };

  const handleSaveEdit = async (next: { details: LeadDetails; service_types: string[] }) => {
    if (!lead) return;
    if (isDemo) {
      const changes = buildLeadEditChanges(
        { details: lead.details ?? {}, service_types: lead.service_types ?? [] },
        next
      );
      updateDemoLead(leadId, { details: next.details, service_types: next.service_types });
      setLead((prev) => (prev ? { ...prev, details: next.details, service_types: next.service_types } : prev));
      if (changes.length > 0) {
        const event: LeadEvent = {
          id: `demo-event-${Date.now().toString(36)}`,
          lead_id: leadId,
          actor: "customer",
          type: "edit",
          changes,
          created_at: new Date().toISOString(),
        };
        saveDemoLeadEvent(event as unknown as Record<string, unknown>);
        setEvents((prev) => [...prev, event]);
      }
      setEditing(false);
      return;
    }

    const res = await fetch(`/api/leads/${leadId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(next),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Failed to save changes");
    setLead(data.lead as Lead);
    if (data.event) setEvents((prev) => [...prev, data.event as LeadEvent]);
    setEditing(false);
  };

  const handleAccept = async (quoteId: string) => {
    // Routed through an API route (rather than updating directly from the
    // browser) so the quote-accepted contractor email can be sent server-side.
    if (!isDemo) {
      try {
        await fetch(`/api/quotes/${quoteId}/accept`, { method: "POST" });
      } catch (e) {
        console.error("Failed to accept quote:", e);
      }
    }
    setQuotes((qs) => qs.map((q) => (q.id === quoteId ? { ...q, status: "accepted" as const } : q)));
  };

  const sortedQuotes = [...quotes].sort((a, b) => a.amount - b.amount);
  const acceptedQuote = sortedQuotes.find((quote) => quote.status === "accepted");
  const lowestQuote = sortedQuotes[0];
  const highestQuote = sortedQuotes[sortedQuotes.length - 1];
  const fastestQuote = sortedQuotes
    .filter((quote) => quote.estimated_date)
    .sort((a, b) => new Date(a.estimated_date ?? "").getTime() - new Date(b.estimated_date ?? "").getTime())[0];

  const formatMoney = (amount: number) => `$${amount.toLocaleString()}`;
  const formatDate = (value: string) => new Date(value).toLocaleDateString();

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
        <Card className="p-5 dark:bg-gray-800 dark:border-gray-700">
          <div className="flex items-start justify-between gap-3 mb-2">
            <h2 className="font-semibold text-gray-900 dark:text-white">Your Request Details</h2>
            {!editing && (
              <button
                type="button"
                data-testid="edit-request"
                onClick={() => setEditing(true)}
                className="flex items-center gap-1 text-sm font-medium text-primary hover:underline flex-shrink-0"
              >
                <Pencil size={14} /> Edit my request
              </button>
            )}
          </div>

          {editing ? (
            <div className="pt-2">
              <p className="text-xs text-gray-400 mb-4">
                You can update your service and job details below. Contact info and address can&apos;t be changed here —
                email {siteConfig.brand.supportEmail} if those need to change. Every change is tracked with a date and time.
              </p>
              <EditRequestForm
                details={lead.details ?? {}}
                serviceTypes={lead.service_types ?? []}
                onSave={handleSaveEdit}
                onCancel={() => setEditing(false)}
              />
            </div>
          ) : lead.details && formatDetailsSummary(lead.details).length > 0 ? (
            <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
              {formatDetailsSummary(lead.details).map((line) => <li key={line}>{line}</li>)}
            </ul>
          ) : (
            <p className="text-sm text-gray-400">No additional details provided.</p>
          )}
        </Card>

        {/* Updates & comments timeline */}
        <Card className="p-5 dark:bg-gray-800 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <History size={18} className="text-gray-400" /> Updates &amp; comments
          </h2>

          {events.length === 0 ? (
            <p className="text-sm text-gray-400 mb-4">
              No updates yet. Add a comment below, or edit your request above — changes show up here with the date and time.
            </p>
          ) : (
            <ul data-testid="event-timeline" className="space-y-3 mb-4">
              {events.map((event) => {
                const when = new Date(event.created_at);
                const timestamp = `${when.toLocaleDateString()} at ${when.toLocaleTimeString()}`;
                return (
                  <li key={event.id} data-testid="event-item" className="border-l-2 border-primary/30 pl-3">
                    <p className="text-xs text-gray-400">{timestamp}</p>
                    {event.type === "comment" ? (
                      <p className="text-sm text-gray-700 dark:text-gray-200 mt-0.5">{event.body}</p>
                    ) : (
                      <ul className="mt-0.5 space-y-0.5">
                        {(event.changes ?? []).map((change, i) => (
                          <li key={`${change.field}-${i}`} className="text-sm text-gray-700 dark:text-gray-200">
                            {formatChangeLine(change)}
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <div className="space-y-2">
            <textarea
              data-testid="comment-input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Add a comment for the contractors reviewing your request..."
              rows={2}
              className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
            {commentError && <p className="text-sm text-red-600">{commentError}</p>}
            <div className="flex justify-end">
              <Button
                data-testid="post-comment"
                size="sm"
                onClick={handlePostComment}
                disabled={postingComment || !comment.trim()}
              >
                {postingComment ? "Posting..." : "Post comment"}
              </Button>
            </div>
          </div>
        </Card>

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
              <Card className="p-5 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">Compare at a glance</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Quotes are sorted by price so you can spot the best fit faster.
                    </p>
                  </div>
                  {acceptedQuote ? <Badge variant="green">Accepted</Badge> : <Badge variant="blue">Ready to compare</Badge>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-900/60 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Lowest quote</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{lowestQuote ? formatMoney(lowestQuote.amount) : "—"}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{lowestQuote?.contractor?.business_name ?? "First quote in the list"}</p>
                  </div>

                  <div className="rounded-xl bg-gray-50 dark:bg-gray-900/60 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Price range</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {lowestQuote && highestQuote ? `${formatMoney(lowestQuote.amount)} - ${formatMoney(highestQuote.amount)}` : "—"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {lowestQuote && highestQuote && lowestQuote.id !== highestQuote.id
                        ? `${formatMoney(highestQuote.amount - lowestQuote.amount)} spread between quotes`
                        : "Only one quote so far"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 dark:bg-gray-900/60 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Fastest availability</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {fastestQuote?.estimated_date ? formatDate(fastestQuote.estimated_date) : "No date yet"}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {fastestQuote?.contractor?.business_name ?? "Contractors can add timing with their quote"}
                    </p>
                  </div>

                  <div className="rounded-xl bg-gray-50 dark:bg-gray-900/60 px-4 py-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {acceptedQuote ? "Accepted quote" : "Status"}
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                      {acceptedQuote ? formatMoney(acceptedQuote.amount) : `${sortedQuotes.length} quote${sortedQuotes.length === 1 ? "" : "s"}`}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {acceptedQuote
                        ? `You chose ${acceptedQuote.contractor?.business_name ?? "this contractor"}`
                        : "Review notes, timing, and pricing below"}
                    </p>
                  </div>
                </div>
              </Card>

              {sortedQuotes.map((quote) => (
                <Card key={quote.id} className="p-5 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-2xl text-gray-900 dark:text-white">{formatMoney(quote.amount)}</p>
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
                        Available: {formatDate(quote.estimated_date)}
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
