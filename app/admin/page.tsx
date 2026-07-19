"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Lead, Contractor, Quote } from "@/types";
import Link from "next/link";
import { CheckCircle, XCircle, Star, Plus, ChevronDown, ChevronUp, Mail, Phone, MessageCircle, Users, Search, Globe, MapPin } from "lucide-react";
import { siteConfig } from "@/config/site";
import { formatDetailsSummary } from "@/lib/details";
import {
  OUTREACH_STATUSES,
  OUTREACH_STATUS_LABELS,
  type OutreachContractor,
  type OutreachStatus,
} from "@/lib/outreach";

interface LeadNotification {
  id: string;
  lead_id: string;
  contractor_name: string | null;
  contractor_email: string | null;
  contractor_phone: string | null;
  channel: string;
  status: string;
  sent_at: string;
}

const NOTIFICATION_BADGE: Record<string, "green" | "amber" | "red" | "gray"> = {
  sent: "green",
  stub: "amber",
  failed: "red",
};

export default function AdminPage() {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [notifications, setNotifications] = useState<LeadNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLeadId, setExpandedLeadId] = useState<string | null>(null);

  // Outreach (supply-side CRM). tq_outreach_contractors has no public RLS
  // policy — admin-only data — so it's read/written through the
  // /api/admin/outreach/** routes (service-role, cookie-gated) rather than
  // the browser Supabase client used for the tables above.
  const [outreach, setOutreach] = useState<OutreachContractor[]>([]);
  const [outreachLoading, setOutreachLoading] = useState(true);
  const [outreachError, setOutreachError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [findingForLeadId, setFindingForLeadId] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    const load = async () => {
      const [leadsRes, contractorsRes, quotesRes, notificationsRes] = await Promise.all([
        supabase.from("tq_leads").select("*, customer:tq_customers(*)").order("created_at", { ascending: false }),
        supabase.from("tq_contractors").select("*").order("created_at", { ascending: false }),
        supabase.from("tq_quotes").select("*, lead:tq_leads(*), contractor:tq_contractors(*)").order("created_at", { ascending: false }),
        supabase.from("tq_lead_notifications").select("*").order("sent_at", { ascending: false }),
      ]);

      if (leadsRes.data) setLeads(leadsRes.data as Lead[]);
      if (contractorsRes.data) setContractors(contractorsRes.data as Contractor[]);
      if (quotesRes.data) setQuotes(quotesRes.data as Quote[]);
      if (notificationsRes.data) setNotifications(notificationsRes.data as LeadNotification[]);
      setLoading(false);
    };
    load();
  }, [supabase]);

  useEffect(() => {
    const loadOutreach = async () => {
      try {
        const res = await fetch("/api/admin/outreach");
        if (!res.ok) {
          setOutreach([]);
          return;
        }
        const data = await res.json();
        setOutreach(Array.isArray(data) ? data : []);
      } catch {
        // No backend configured (demo mode) or a network hiccup — render
        // the section's empty state rather than crashing the page.
        setOutreach([]);
      } finally {
        setOutreachLoading(false);
      }
    };
    loadOutreach();
  }, []);

  const runOutreachFind = async (query: string, leadId?: string) => {
    setOutreachError(null);
    try {
      const res = await fetch("/api/admin/outreach/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, leadId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setOutreachError(data.error || "Search failed");
        return;
      }
      const rows: OutreachContractor[] = data.rows ?? [];
      setOutreach((prev) => {
        const byId = new Map(prev.map((r) => [r.id, r] as const));
        for (const row of rows) byId.set(row.id, row);
        return Array.from(byId.values()).sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
      if (rows.length === 0) {
        setOutreachError(`No results for "${query}"`);
      }
    } catch {
      setOutreachError("Network error — search failed");
    }
  };

  const handleStandaloneSearch = async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    await runOutreachFind(q);
    setSearching(false);
  };

  const handleFindForLead = async (lead: Lead) => {
    setFindingForLeadId(lead.id);
    await runOutreachFind(`tree service near ${lead.address}`, lead.id);
    setFindingForLeadId(null);
  };

  const updateOutreachStatus = async (id: string, status: OutreachStatus) => {
    setOutreach((rows) => rows.map((r) => (r.id === id ? { ...r, status } : r)));
    const res = await fetch(`/api/admin/outreach/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOutreach((rows) => rows.map((r) => (r.id === id ? updated : r)));
    }
  };

  const saveOutreachNotes = async (id: string) => {
    const notes = notesDraft[id];
    if (notes === undefined) return;
    const res = await fetch(`/api/admin/outreach/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notes }),
    });
    if (res.ok) {
      const updated = await res.json();
      setOutreach((rows) => rows.map((r) => (r.id === id ? updated : r)));
    }
  };

  const outreachCounts = {
    found: outreach.filter((r) => r.status === "found").length,
    contacted: outreach.filter((r) => r.status === "contacted").length,
    responded: outreach.filter((r) => r.status === "responded").length,
    joined: outreach.filter((r) => r.status === "joined").length,
  };

  const OUTREACH_STATUS_BADGE: Record<OutreachStatus, "green" | "amber" | "red" | "gray" | "blue"> = {
    found: "gray",
    contacted: "amber",
    no_answer: "red",
    responded: "blue",
    joined: "green",
    declined: "red",
  };

  const toggleContractorApproval = async (id: string, approved: boolean) => {
    await supabase.from("tq_contractors").update({ approved }).eq("id", id);
    setContractors((cs) => cs.map((c) => (c.id === id ? { ...c, approved } : c)));
  };

  const toggleFounding = async (id: string, is_founding: boolean) => {
    await supabase.from("tq_contractors").update({ is_founding }).eq("id", id);
    setContractors((cs) => cs.map((c) => (c.id === id ? { ...c, is_founding } : c)));
  };

  const grantCredits = async (id: string, currentCredits: number, amount: number) => {
    const next = Math.max(0, currentCredits + amount);
    await supabase.from("tq_contractors").update({ lead_credits: next }).eq("id", id);
    setContractors((cs) => cs.map((c) => (c.id === id ? { ...c, lead_credits: next } : c)));
  };

  const updateLeadStatus = async (id: string, status: string) => {
    await supabase.from("tq_leads").update({ status }).eq("id", id);
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status: status as Lead["status"] } : l)));
  };

  const notificationsForLead = (leadId: string) => notifications.filter((n) => n.lead_id === leadId);
  const contactedCount = (leadId: string) => new Set(notificationsForLead(leadId).map((n) => n.contractor_email)).size;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-bold text-xl text-gray-900 dark:text-white">{siteConfig.brand.emoji} {siteConfig.brand.name} Admin</span>
          <Link href="/" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">← Back to site</Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        {/* Leads */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Leads ({leads.length})</h2>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : leads.length === 0 ? (
            <Card className="p-8 text-center text-gray-400 dark:bg-gray-800 dark:border-gray-700">No leads yet</Card>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => {
                const isExpanded = expandedLeadId === lead.id;
                const leadNotifications = notificationsForLead(lead.id);
                const photos = lead.photo_urls && lead.photo_urls.length > 0 ? lead.photo_urls : lead.photo_url ? [lead.photo_url] : [];
                const detailLines = lead.details ? formatDetailsSummary(lead.details) : [];

                return (
                  <Card key={lead.id} className="dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
                    <div className="p-4 flex items-center gap-4">
                      {lead.photo_url && (
                        <img src={lead.photo_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {lead.service_types.map((id) => siteConfig.serviceTypes.find((s) => s.id === id)?.label ?? id).join(", ")}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{lead.address}</p>
                        <p className="text-xs text-gray-400">{new Date(lead.created_at).toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400" title="Contractors contacted">
                        <Users size={14} /> {contactedCount(lead.id)}
                      </div>
                      <div className="flex gap-2 items-center">
                        <select
                          value={lead.status}
                          onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                          className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                        >
                          <option value="new">New</option>
                          <option value="quoted">Quoted</option>
                          <option value="closed">Closed</option>
                        </select>
                        <button
                          onClick={async () => {
                            const res = await fetch(`/api/notifications/send-lead-alerts?leadId=${lead.id}`);
                            const data = await res.json();
                            alert(`Sent ${data.sent ?? 0} notifications${data.errors?.length ? ` — errors: ${data.errors.join(", ")}` : ""}`);
                            window.location.reload();
                          }}
                          className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
                          title="Manually resend lead alerts to contractors"
                        >
                          🔄 Resend Alerts
                        </button>
                        <button
                          onClick={() => handleFindForLead(lead)}
                          disabled={findingForLeadId === lead.id}
                          className="px-3 py-1.5 text-sm bg-primary/10 hover:bg-primary/20 text-primary rounded-lg border border-primary/20 transition-colors disabled:opacity-50"
                          title="Search Google Places for tree services near this lead's address"
                          data-testid="find-contractors-for-lead"
                        >
                          {findingForLeadId === lead.id ? "Searching…" : "🔎 Find contractors"}
                        </button>
                        <button
                          onClick={() => setExpandedLeadId(isExpanded ? null : lead.id)}
                          className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300"
                          title="View full details"
                          data-testid="lead-expand-toggle"
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-100 dark:border-gray-700 p-4 bg-gray-50 dark:bg-gray-900/40 space-y-5" data-testid="lead-expanded-detail">
                        {/* Photos */}
                        {photos.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Photos</p>
                            <div className="flex gap-2 overflow-x-auto pb-1">
                              {photos.map((url, i) => (
                                <img key={i} src={url} alt={`Photo ${i + 1}`} className="w-20 h-20 object-cover rounded-lg flex-shrink-0" />
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Details */}
                        {detailLines.length > 0 && (
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Job Details</p>
                            <ul className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
                              {detailLines.map((line) => <li key={line}>{line}</li>)}
                            </ul>
                          </div>
                        )}

                        {/* Contact */}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Customer Contact</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">
                            {lead.customer?.name ?? "Unknown"}
                            {lead.customer?.phone && <> · <a href={`tel:${lead.customer.phone}`} className="text-primary hover:underline">{lead.customer.phone}</a></>}
                            {lead.customer?.email && <> · <a href={`mailto:${lead.customer.email}`} className="text-primary hover:underline">{lead.customer.email}</a></>}
                          </p>
                        </div>

                        {/* Notification log */}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                            Contractors Contacted ({leadNotifications.length})
                          </p>
                          {leadNotifications.length === 0 ? (
                            <p className="text-sm text-gray-400">No contractors have been notified for this lead yet.</p>
                          ) : (
                            <div className="space-y-2">
                              {leadNotifications.map((n) => (
                                <div key={n.id} className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700 text-sm">
                                  <span className="font-medium text-gray-900 dark:text-white">{n.contractor_name ?? "Unknown"}</span>
                                  <Badge variant={NOTIFICATION_BADGE[n.status] ?? "gray"}>{n.status}</Badge>
                                  <span className="text-xs text-gray-400">{new Date(n.sent_at).toLocaleString()}</span>
                                  <div className="flex items-center gap-2 ml-auto">
                                    {n.contractor_email && (
                                      <a href={`mailto:${n.contractor_email}`} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20" title={`Email ${n.contractor_email}`}>
                                        <Mail size={14} />
                                      </a>
                                    )}
                                    {n.contractor_phone && (
                                      <>
                                        <a href={`tel:${n.contractor_phone}`} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20" title={`Call ${n.contractor_phone}`}>
                                          <Phone size={14} />
                                        </a>
                                        <a href={`sms:${n.contractor_phone}`} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20" title={`Text ${n.contractor_phone}`}>
                                          <MessageCircle size={14} />
                                        </a>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Outreach: nearby contractors found for this lead */}
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                            Contractors Found Nearby ({outreach.filter((r) => r.lead_id === lead.id).length})
                          </p>
                          {outreachError && isExpanded && (
                            <p className="text-sm text-red-500 mb-2" data-testid="outreach-lead-error">{outreachError}</p>
                          )}
                          {outreach.filter((r) => r.lead_id === lead.id).length === 0 ? (
                            <p className="text-sm text-gray-400">
                              No contractors found nearby yet — use &quot;Find contractors&quot; above to search Google Places.
                            </p>
                          ) : (
                            <div className="space-y-2">
                              {outreach.filter((r) => r.lead_id === lead.id).map((c) => (
                                <div key={c.id} className="flex flex-wrap items-center gap-3 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-gray-100 dark:border-gray-700 text-sm">
                                  <span className="font-medium text-gray-900 dark:text-white">{c.name}</span>
                                  {c.rating != null && (
                                    <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                      <Star size={12} className="fill-accent text-accent" /> {c.rating} ({c.review_count ?? 0})
                                    </span>
                                  )}
                                  <Badge variant={OUTREACH_STATUS_BADGE[c.status]}>{OUTREACH_STATUS_LABELS[c.status]}</Badge>
                                  <div className="flex items-center gap-2 ml-auto">
                                    {c.phone && (
                                      <a href={`tel:${c.phone}`} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20" title={`Call ${c.phone}`}>
                                        <Phone size={14} />
                                      </a>
                                    )}
                                    {c.email && (
                                      <a href={`mailto:${c.email}`} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20" title={`Email ${c.email}`}>
                                        <Mail size={14} />
                                      </a>
                                    )}
                                    {c.website && (
                                      <a href={c.website} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20" title="Visit website">
                                        <Globe size={14} />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Contractors */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Contractors ({contractors.length})</h2>
          {loading ? (
            <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : contractors.length === 0 ? (
            <Card className="p-8 text-center text-gray-400 dark:bg-gray-800 dark:border-gray-700">No contractors yet</Card>
          ) : (
            <div className="space-y-3">
              {contractors.map((c) => (
                <Card key={c.id} className="p-4 flex flex-wrap items-center gap-4 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex-1 min-w-[180px]">
                    <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                      {c.business_name}
                      {c.is_founding && <Badge variant="amber">Founding</Badge>}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{c.email}</p>
                    <p className="text-xs text-gray-400">Service area: {c.service_area?.join(", ") || "N/A"}</p>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Credits:</span>
                    <span className="font-semibold text-gray-900 dark:text-white w-6 text-center">{c.lead_credits ?? 0}</span>
                    <button
                      onClick={() => grantCredits(c.id, c.lead_credits ?? 0, 1)}
                      className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"
                      title="Grant 1 credit"
                    >
                      <Plus size={14} />
                    </button>
                    <button
                      onClick={() => grantCredits(c.id, c.lead_credits ?? 0, 5)}
                      className="px-2 py-1 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 text-xs font-medium"
                      title="Grant 5 credits"
                    >
                      +5
                    </button>
                  </div>

                  <Button
                    size="sm"
                    variant={c.is_founding ? "ghost" : "secondary"}
                    onClick={() => toggleFounding(c.id, !c.is_founding)}
                    title="Toggle founding-contractor status"
                  >
                    <Star size={14} className={c.is_founding ? "fill-accent text-accent" : ""} />
                    {c.is_founding ? "Unset Founding" : "Make Founding"}
                  </Button>

                  <Badge variant={c.approved ? "green" : "amber"}>
                    {c.approved ? "Approved" : "Pending"}
                  </Badge>
                  <Button
                    size="sm"
                    variant={c.approved ? "ghost" : "secondary"}
                    onClick={() => toggleContractorApproval(c.id, !c.approved)}
                  >
                    {c.approved ? <XCircle size={16} /> : <CheckCircle size={16} />}
                    {c.approved ? "Revoke" : "Approve"}
                  </Button>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Quotes */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quotes ({quotes.length})</h2>
          {loading ? (
            <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : quotes.length === 0 ? (
            <Card className="p-8 text-center text-gray-400 dark:bg-gray-800 dark:border-gray-700">No quotes yet</Card>
          ) : (
            <div className="space-y-3">
              {quotes.map((q) => (
                <Card key={q.id} className="p-4 flex items-center gap-4 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white">
                      ${q.amount} — {q.contractor?.business_name ?? "Contractor"}
                    </p>
                    {q.lead && <p className="text-sm text-gray-500 dark:text-gray-400">{q.lead.service_types?.map((id) => siteConfig.serviceTypes.find((s) => s.id === id)?.label ?? id).join(", ")}</p>}
                    {q.notes && <p className="text-xs text-gray-400 truncate mt-1">{q.notes}</p>}
                  </div>
                  <Badge variant={q.status === "pending" ? "amber" : q.status === "accepted" ? "green" : "gray"}>{q.status}</Badge>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Outreach — supply-side contractor CRM (GTM Phase 1) */}
        <section data-testid="outreach-section">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Outreach</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Find local tree service companies near incoming customer requests (or search any area) and track calling/emailing them until they join.
          </p>

          {/* Summary counts */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
            {([
              ["Found", outreachCounts.found, "gray"],
              ["Contacted", outreachCounts.contacted, "amber"],
              ["Responded", outreachCounts.responded, "blue"],
              ["Joined", outreachCounts.joined, "green"],
            ] as const).map(([label, count]) => (
              <Card key={label} className="p-4 text-center dark:bg-gray-800 dark:border-gray-700">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
              </Card>
            ))}
          </div>

          {/* Standalone prospecting search */}
          <Card className="p-4 mb-5 dark:bg-gray-800 dark:border-gray-700">
            <label htmlFor="outreach-search" className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2 block">
              Search any area
            </label>
            <div className="flex flex-wrap gap-2">
              <input
                id="outreach-search"
                data-testid="outreach-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleStandaloneSearch();
                }}
                placeholder='e.g. "tree service in Turnersville, NJ"'
                className="flex-1 min-w-[220px] px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
              />
              <Button size="sm" onClick={handleStandaloneSearch} disabled={searching || !searchQuery.trim()} data-testid="outreach-search-button">
                <Search size={14} />
                {searching ? "Searching…" : "Search"}
              </Button>
            </div>
            {outreachError && <p className="text-sm text-red-500 mt-2" data-testid="outreach-error">{outreachError}</p>}
          </Card>

          {/* Full outreach table */}
          {outreachLoading ? (
            <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : outreach.length === 0 ? (
            <Card className="p-8 text-center text-gray-400 dark:bg-gray-800 dark:border-gray-700" data-testid="outreach-empty">
              Nothing found yet — use the search above, or search from a lead&apos;s details below.
            </Card>
          ) : (
            <div className="space-y-3">
              {outreach.map((c) => (
                <Card key={c.id} className="p-4 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex flex-wrap items-start gap-4">
                    <div className="flex-1 min-w-[200px]">
                      <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2 flex-wrap">
                        {c.name}
                        {c.rating != null && (
                          <span className="text-xs text-gray-400 flex items-center gap-0.5 font-normal">
                            <Star size={12} className="fill-accent text-accent" /> {c.rating} ({c.review_count ?? 0})
                          </span>
                        )}
                      </p>
                      {c.address && (
                        <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                          <MapPin size={11} /> {c.address}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-3 mt-1.5 text-sm">
                        {c.phone && (
                          <a href={`tel:${c.phone}`} className="text-primary hover:underline flex items-center gap-1">
                            <Phone size={13} /> {c.phone}
                          </a>
                        )}
                        {c.email && (
                          <a href={`mailto:${c.email}`} className="text-primary hover:underline flex items-center gap-1">
                            <Mail size={13} /> {c.email}
                          </a>
                        )}
                        {c.website && (
                          <a href={c.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                            <Globe size={13} /> Website
                          </a>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <select
                        value={c.status}
                        onChange={(e) => updateOutreachStatus(c.id, e.target.value as OutreachStatus)}
                        className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm"
                        data-testid="outreach-status-select"
                      >
                        {OUTREACH_STATUSES.map((s) => (
                          <option key={s} value={s}>{OUTREACH_STATUS_LABELS[s]}</option>
                        ))}
                      </select>
                      <div className="text-xs text-gray-400 text-right">
                        {c.contacted_at && <p>Contacted {new Date(c.contacted_at).toLocaleDateString()}</p>}
                        <p>Found {new Date(c.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>

                  <textarea
                    value={notesDraft[c.id] ?? c.notes ?? ""}
                    onChange={(e) => setNotesDraft((d) => ({ ...d, [c.id]: e.target.value }))}
                    onBlur={() => saveOutreachNotes(c.id)}
                    placeholder="Notes (call outcome, next steps...)"
                    rows={1}
                    className="mt-3 w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white text-sm resize-y"
                    data-testid="outreach-notes-input"
                  />
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
