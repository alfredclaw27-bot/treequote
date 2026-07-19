"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { LeadCard } from "@/components/LeadCard";
import { siteConfig } from "@/config/site";
import { MOCK_LEADS, MOCK_QUOTES } from "@/lib/mock-data";
import { isDemoMode, getDemoUnlockedLeadIds, getDemoCredits, getDemoQuotes, exitDemoMode } from "@/lib/demo";
import { calculateLeadFit } from "@/lib/lead-fit";
import type { Lead, Quote } from "@/types";
import type { ContractorMatchProfile } from "@/lib/lead-fit";
import { LayoutDashboard, MessageSquare, User, LogOut, Sparkles } from "lucide-react";

type Tab = "leads" | "quotes" | "account";
type LeadSort = "best-fit" | "newest";
type LeadFilter = "all" | "new" | "unlocked";

const DEMO_CONTRACTOR_PROFILE: ContractorMatchProfile = {
  specialties: ["removal", "trimming", "stump"],
  bucketReach: "50_75ft",
  crewSize: "3-4",
  equipment: ["stump_grinder", "chipper", "climbing_gear"],
};

const DEMO_CONTRACTOR_LOCATION = {
  lat: 39.643,
  lng: -75.052,
};

function calcDistanceMiles(origin: { lat: number; lng: number } | undefined, lead: Lead): number | null {
  if (!origin || !lead.latitude || !lead.longitude) return null;

  const R = 3958.8;
  const dLat = (lead.latitude - origin.lat) * Math.PI / 180;
  const dLng = (lead.longitude - origin.lng) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(origin.lat * Math.PI / 180) * Math.cos(lead.latitude * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function ContractorDashboardPage() {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("leads");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [contractorProfile, setContractorProfile] = useState<ContractorMatchProfile | undefined>(undefined);
  const [user, setUser] = useState<{ email?: string; business_name?: string; lead_credits?: number; is_founding?: boolean } | null>(null);
  const [leadSort, setLeadSort] = useState<LeadSort>("best-fit");
  const [leadFilter, setLeadFilter] = useState<LeadFilter>("all");
  const [serviceFilter, setServiceFilter] = useState<string>("all");

  useEffect(() => {
    const load = async () => {
      if (isDemoMode()) {
        setDemo(true);
        setContractorProfile(DEMO_CONTRACTOR_PROFILE);
        const unlockedIds = new Set(getDemoUnlockedLeadIds());
        setLeads(MOCK_LEADS.map((l) => ({ ...l, unlocked: unlockedIds.has(l.id), unlock_count: unlockedIds.has(l.id) ? 1 : 0 })));
        setQuotes([...(getDemoQuotes() as unknown as Quote[]), ...MOCK_QUOTES]);
        setUser({
          email: `demo@${siteConfig.brand.domain}`,
          business_name: `${siteConfig.brand.emoji} Demo Contractor`,
          lead_credits: getDemoCredits(),
          is_founding: true,
        });
        setLoading(false);
        return;
      }

      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        window.location.href = "/contractor/login";
        return;
      }

      const [{ data: contractor }, leadsRes, quotesRes] = await Promise.all([
        supabase.from("tq_contractors").select("*").eq("id", authUser.id).single(),
        fetch("/api/contractor/leads").then((r) => (r.ok ? r.json() : { leads: [] })).catch(() => ({ leads: [] })),
        supabase.from("tq_quotes").select("*, lead:tq_leads(*)").eq("contractor_id", authUser.id).order("created_at", { ascending: false }),
      ]);

      setUser({
        email: authUser.email,
        business_name: contractor?.business_name,
        lead_credits: contractor?.lead_credits ?? 0,
        is_founding: contractor?.is_founding ?? false,
      });
      setContractorProfile({
        specialties: contractor?.specialties ?? [],
        bucketReach: contractor?.equipment?.bucketReach,
        crewSize: contractor?.equipment?.crewSize,
        equipment: contractor?.equipment?.equipment ?? [],
      });
      setLeads(leadsRes.leads ?? []);
      if (quotesRes.data) setQuotes(quotesRes.data as Quote[]);
      setLoading(false);
    };
    load();
  }, [supabase]);

  const handleLogout = async () => {
    if (demo) {
      exitDemoMode();
      window.location.href = "/contractor/login";
      return;
    }
    await supabase.auth.signOut();
    window.location.href = "/contractor/login";
  };

  const tabs = [
    { id: "leads" as Tab, label: "Leads", icon: LayoutDashboard, count: leads.filter((l) => l.status === "new").length },
    { id: "quotes" as Tab, label: "My Quotes", icon: MessageSquare, count: quotes.length },
    { id: "account" as Tab, label: "Account", icon: User, count: null },
  ];

  const contractorLocation = demo ? DEMO_CONTRACTOR_LOCATION : undefined;
  const serviceOptions = siteConfig.serviceTypes.filter((service) =>
    leads.some((lead) => lead.service_types.includes(service.id))
  );
  const visibleLeads = leads
    .filter((lead) => {
      if (leadFilter === "new" && lead.status !== "new") return false;
      if (leadFilter === "unlocked" && !lead.unlocked) return false;
      if (serviceFilter !== "all" && !lead.service_types.includes(serviceFilter)) return false;
      return true;
    })
    .sort((a, b) => {
      if (leadSort === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }

      const aScore = calculateLeadFit(a, contractorProfile, calcDistanceMiles(contractorLocation, a)).score;
      const bScore = calculateLeadFit(b, contractorProfile, calcDistanceMiles(contractorLocation, b)).score;
      return bScore - aScore || new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{siteConfig.brand.emoji}</span>
            <div>
              <span className="font-bold text-lg text-gray-900 dark:text-white">{siteConfig.brand.name}</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">{user?.business_name ?? user?.email ?? "Contractor"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user?.is_founding && <Badge variant="amber">Founding</Badge>}
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut size={16} className="mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
        <div className="max-w-4xl mx-auto flex">
          {tabs.map(({ id, label, icon: Icon, count }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 flex items-center justify-center gap-2 py-4 text-sm font-medium border-b-2 transition-colors ${
                tab === id ? "border-primary text-primary" : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <Icon size={18} />
              {label}
              {count !== null && count > 0 && (
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${tab === id ? "bg-primary/10 text-primary-dark dark:text-primary" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"}`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {demo && (
          <div className="mb-6 flex items-center gap-2 bg-accent/10 border border-accent/30 rounded-xl px-4 py-2.5 text-sm text-accent-dark dark:text-accent">
            <Sparkles size={16} /> Demo mode — data resets when you clear this browser&apos;s local storage.
          </div>
        )}

        {/* Leads Tab */}
        {tab === "leads" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Available Leads</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">{visibleLeads.length} of {leads.length} leads in your area</p>
              </div>
              <Badge variant="amber">Up to {siteConfig.maxContractorsPerLead} contractors per lead</Badge>
            </div>

            {!loading && leads.length > 0 && (
              <Card className="p-4 dark:bg-gray-800 dark:border-gray-700" data-testid="lead-triage-controls">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                  <div className="flex flex-wrap gap-2">
                    {([
                      { id: "all", label: "All leads" },
                      { id: "new", label: "New only" },
                      { id: "unlocked", label: "Unlocked" },
                    ] as { id: LeadFilter; label: string }[]).map((option) => (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => setLeadFilter(option.id)}
                        className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                          leadFilter === option.id
                            ? "bg-primary text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="mb-1 block">Sort</span>
                      <select
                        value={leadSort}
                        onChange={(e) => setLeadSort(e.target.value as LeadSort)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        data-testid="lead-sort-select"
                      >
                        <option value="best-fit">Best fit</option>
                        <option value="newest">Newest</option>
                      </select>
                    </label>

                    <label className="text-sm text-gray-500 dark:text-gray-400">
                      <span className="mb-1 block">Service</span>
                      <select
                        value={serviceFilter}
                        onChange={(e) => setServiceFilter(e.target.value)}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary/40 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                        data-testid="lead-service-select"
                      >
                        <option value="all">All services</option>
                        {serviceOptions.map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.label}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>
                </div>
              </Card>
            )}

            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="p-4 h-32 animate-pulse bg-gray-100 dark:bg-gray-800" />
                ))}
              </div>
            ) : (
              visibleLeads.map((lead) => (
                <LeadCard
                  key={lead.id}
                  lead={lead}
                  showQuoteButton={lead.status !== "closed"}
                  contractorProfile={contractorProfile}
                  contractorLocation={contractorLocation}
                  onQuote={() => (window.location.href = `/contractor/quote/${lead.id}`)}
                />
              ))
            )}

            {leads.length === 0 && !loading && (
              <Card className="p-12 text-center dark:bg-gray-800 dark:border-gray-700">
                <p className="text-gray-400 text-lg mb-2">No leads yet</p>
                <p className="text-gray-400 text-sm">Check back soon — customers are submitting requests daily.</p>
              </Card>
            )}

            {leads.length > 0 && visibleLeads.length === 0 && !loading && (
              <Card className="p-8 text-center dark:bg-gray-800 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">No leads match those filters right now.</p>
              </Card>
            )}
          </div>
        )}

        {/* Quotes Tab */}
        {tab === "quotes" && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Quotes</h2>
            {quotes.length === 0 ? (
              <Card className="p-12 text-center dark:bg-gray-800 dark:border-gray-700">
                <p className="text-gray-400 text-lg mb-2">No quotes submitted yet</p>
                <p className="text-gray-400 text-sm">Unlock a lead to see it here.</p>
              </Card>
            ) : (
              quotes.map((quote) => (
                <Card key={quote.id} className="p-5 dark:bg-gray-800 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <Badge variant={quote.status === "pending" ? "amber" : quote.status === "accepted" ? "green" : "gray"}>
                      {quote.status}
                    </Badge>
                    <span className="font-bold text-lg text-gray-900 dark:text-white">${quote.amount}</span>
                  </div>
                  {quote.lead && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {quote.lead.service_types?.map((id) => siteConfig.serviceTypes.find((s) => s.id === id)?.label ?? id).join(", ")} · {quote.lead.address}
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
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Account</h2>
            <Card className="p-6 space-y-4 dark:bg-gray-800 dark:border-gray-700">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center text-2xl">🏢</div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white">{user?.business_name ?? "Your Business"}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 space-y-4 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">Lead Credits</h3>
              <div className="flex items-center justify-between p-4 bg-primary/5 rounded-xl">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white" data-testid="lead-credits-count">{user?.lead_credits ?? 0} free credits remaining</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Use a credit to unlock a lead instead of paying.</p>
                </div>
                {user?.is_founding && <Badge variant="amber">Founding contractor</Badge>}
              </div>
              <p className="text-xs text-gray-400">
                Out of credits? Leads can also be unlocked with a one-time payment via Stripe on the lead page.
                Need more credits? Contact {siteConfig.brand.supportEmail}.
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
