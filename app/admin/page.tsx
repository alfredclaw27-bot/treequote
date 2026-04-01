"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import type { Lead, Contractor, Quote } from "@/types";
import Link from "next/link";
import { CheckCircle, XCircle } from "lucide-react";

export default function AdminPage() {
  const supabase = createClient();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [contractors, setContractors] = useState<Contractor[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [leadsRes, contractorsRes, quotesRes] = await Promise.all([
        supabase.from("leads").select("*, customer:customers(*)").order("created_at", { ascending: false }),
        supabase.from("contractors").select("*").order("created_at", { ascending: false }),
        supabase.from("quotes").select("*, lead:leads(*), contractor:contractors(*)").order("created_at", { ascending: false }),
      ]);

      if (leadsRes.data) setLeads(leadsRes.data as Lead[]);
      if (contractorsRes.data) setContractors(contractorsRes.data as Contractor[]);
      if (quotesRes.data) setQuotes(quotesRes.data as Quote[]);
      setLoading(false);
    };
    load();
  }, [supabase]);

  const toggleContractorApproval = async (id: string, approved: boolean) => {
    await supabase.from("contractors").update({ approved }).eq("id", id);
    setContractors((cs) => cs.map((c) => (c.id === id ? { ...c, approved } : c)));
  };

  const updateLeadStatus = async (id: string, status: string) => {
    await supabase.from("leads").update({ status }).eq("id", id);
    setLeads((ls) => ls.map((l) => (l.id === id ? { ...l, status: status as Lead["status"] } : l)));
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <span className="font-bold text-xl text-gray-900">🌳 TreeQuote Admin</span>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">← Back to site</Link>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8 space-y-10">
        {/* Leads */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Leads ({leads.length})</h2>
          {loading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : leads.length === 0 ? (
            <Card className="p-8 text-center text-gray-400">No leads yet</Card>
          ) : (
            <div className="space-y-3">
              {leads.map((lead) => (
                <Card key={lead.id} className="p-4 flex items-center gap-4">
                  {lead.photo_url && (
                    <img src={lead.photo_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 capitalize truncate">{lead.service_types.join(", ")}</p>
                    <p className="text-sm text-gray-500 truncate">{lead.address}</p>
                    <p className="text-xs text-gray-400">{new Date(lead.created_at).toLocaleString()}</p>
                  </div>
                  <select
                    value={lead.status}
                    onChange={(e) => updateLeadStatus(lead.id, e.target.value)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm"
                  >
                    <option value="new">New</option>
                    <option value="quoted">Quoted</option>
                    <option value="closed">Closed</option>
                  </select>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Contractors */}
        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-4">Contractors ({contractors.length})</h2>
          {loading ? (
            <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : contractors.length === 0 ? (
            <Card className="p-8 text-center text-gray-400">No contractors yet</Card>
          ) : (
            <div className="space-y-3">
              {contractors.map((c) => (
                <Card key={c.id} className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">{c.business_name}</p>
                    <p className="text-sm text-gray-500">{c.email}</p>
                    <p className="text-xs text-gray-400">Service area: {c.service_area?.join(", ") || "N/A"}</p>
                  </div>
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
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quotes ({quotes.length})</h2>
          {loading ? (
            <div className="space-y-3">{[1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : quotes.length === 0 ? (
            <Card className="p-8 text-center text-gray-400">No quotes yet</Card>
          ) : (
            <div className="space-y-3">
              {quotes.map((q) => (
                <Card key={q.id} className="p-4 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      ${q.amount} — {(q.contractor as unknown as Contractor)?.business_name ?? "Contractor"}
                    </p>
                    {q.lead && <p className="text-sm text-gray-500 capitalize">{q.lead.service_types?.join(", ")}</p>}
                    {q.notes && <p className="text-xs text-gray-400 truncate mt-1">{q.notes}</p>}
                  </div>
                  <Badge variant={q.status === "pending" ? "amber" : q.status === "accepted" ? "green" : "gray"}>{q.status}</Badge>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
