"use client";
import { useState, useEffect, Suspense, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { AnalysisDisplay } from "@/components/AnalysisDisplay";
import { QuoteForm } from "@/components/QuoteForm";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, MapPin, Clock, CreditCard, CheckCircle, Zap, Lock } from "lucide-react";
import type { Lead } from "@/types";
import { siteConfig, getLeadPriceCents } from "@/config/site";
import { formatDetailsSummary, maskAddressToCity } from "@/lib/details";
import { findMockLead } from "@/lib/mock-data";
import { isDemoMode, isDemoLeadUnlocked, unlockDemoLead, getDemoCredits, spendDemoCredit, saveDemoQuote } from "@/lib/demo";

function QuotePageContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const leadId = params.leadId as string;
  const supabase = createClient();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [demo, setDemo] = useState(false);
  const [leadCredits, setLeadCredits] = useState(0);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [creditLoading, setCreditLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [hasAccess, setHasAccess] = useState(false);
  const [checkingAccess, setCheckingAccess] = useState(false);

  const successParam = searchParams.get("success");
  const sessionIdParam = searchParams.get("session_id");
  const canceledParam = searchParams.get("canceled");

  const loadLead = useCallback(async () => {
    if (isDemoMode()) {
      setDemo(true);
      const mockLead = findMockLead(leadId);
      if (mockLead) {
        setLead(mockLead);
        setHasAccess(isDemoLeadUnlocked(leadId));
        setLeadCredits(getDemoCredits());
      }
      setLoading(false);
      return;
    }

    const res = await fetch(`/api/contractor/leads/${leadId}`);
    if (res.status === 401) {
      router.push("/contractor/login");
      return;
    }
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data = await res.json();
    setLead(data.lead);
    setHasAccess(!!data.lead?.unlocked);
    setLeadCredits(data.contractor?.lead_credits ?? 0);
    setLoading(false);

    // If returning from a successful Stripe checkout, verify server-side
    if (successParam === "true" && sessionIdParam) {
      setCheckingAccess(true);
      try {
        const verifyRes = await fetch(`/api/contractor/verify-session?session_id=${sessionIdParam}&lead_id=${leadId}`);
        const verifyData = await verifyRes.json();
        if (verifyData.hasAccess) {
          const reRes = await fetch(`/api/contractor/leads/${leadId}`);
          if (reRes.ok) {
            const reData = await reRes.json();
            setLead(reData.lead);
            setHasAccess(!!reData.lead?.unlocked);
            setLeadCredits(reData.contractor?.lead_credits ?? 0);
          } else {
            setHasAccess(true);
          }
        }
      } catch (e) {
        console.error("Verify failed:", e);
      }
      setCheckingAccess(false);
    }
  }, [leadId, router, successParam, sessionIdParam]);

  useEffect(() => {
    loadLead();
  }, [loadLead]);

  // Re-fetch the lead after an unlock so contact info + the full street
  // address (both masked pre-unlock) come back unmasked, without needing a
  // full page reload.
  const refreshLead = useCallback(async () => {
    if (demo) return;
    try {
      const res = await fetch(`/api/contractor/leads/${leadId}`);
      if (!res.ok) return;
      const data = await res.json();
      setLead(data.lead);
      setHasAccess(!!data.lead?.unlocked);
      setLeadCredits(data.contractor?.lead_credits ?? leadCredits);
    } catch (e) {
      console.error("Refresh lead failed:", e);
    }
  }, [demo, leadId, leadCredits]);

  const handlePayment = async () => {
    setPaymentError("");
    setPaymentLoading(true);
    try {
      const res = await fetch("/api/contractor/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });

      const data = await res.json();
      if (res.status === 401) { router.push("/contractor/login"); return; }
      if (!res.ok) throw new Error(data.error || "Failed to create checkout session");

      if (data.already_paid) {
        await refreshLead();
        return;
      }

      window.location.href = data.url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to start payment. Please try again.";
      setPaymentError(message);
      setPaymentLoading(false);
    }
  };

  const handleCreditUnlock = async () => {
    setPaymentError("");
    setCreditLoading(true);
    try {
      if (demo) {
        if (getDemoCredits() < 1) {
          setPaymentError("No lead credits remaining.");
          setCreditLoading(false);
          return;
        }
        unlockDemoLead(leadId);
        setLeadCredits(spendDemoCredit());
        setHasAccess(true);
        setCreditLoading(false);
        return;
      }

      const res = await fetch("/api/contractor/unlock-with-credit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId }),
      });
      const data = await res.json();
      if (res.status === 401) { router.push("/contractor/login"); return; }
      if (!res.ok) throw new Error(data.error || "Failed to unlock lead");

      setLeadCredits(data.remaining_credits ?? Math.max(0, leadCredits - 1));
      await refreshLead();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to unlock lead. Please try again.";
      setPaymentError(message);
    } finally {
      setCreditLoading(false);
    }
  };

  const handleSubmitQuote = async ({ amount, notes, estimatedDate }: { amount: number; notes: string; estimatedDate: string }) => {
    if (demo) {
      saveDemoQuote({
        id: `demo-quote-${Date.now().toString(36)}`,
        lead_id: leadId,
        amount,
        notes,
        estimated_date: estimatedDate,
        status: "pending",
        created_at: new Date().toISOString(),
        lead,
      });
      router.push("/contractor/dashboard");
      return;
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/contractor/login");
      return;
    }

    // Routed through an API route (rather than inserting directly from the
    // browser) so the quote-received customer email can be sent server-side.
    const res = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lead_id: leadId,
        contractor_id: user.id,
        amount,
        notes,
        estimated_date: estimatedDate || null,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || "Failed to submit quote");
    }

    router.push("/contractor/dashboard?tab=quotes");
  };

  if (loading || checkingAccess) {
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
          <Link href="/contractor/dashboard" className="text-primary font-medium hover:underline">← Back to Dashboard</Link>
        </Card>
      </main>
    );
  }

  const priceCents = getLeadPriceCents(lead.service_types);
  const showPaymentStep = !hasAccess;
  const showCanceledNotice = canceledParam === "true";
  const isFull = !!lead.is_full && !hasAccess;
  // Non-demo leads already come back masked pre-unlock from the API; demo
  // mode uses static mock data with a real address, so mask it client-side.
  const preUnlockAddress = demo ? maskAddressToCity(lead.address) : lead.address;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <Link href="/contractor/dashboard" className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
            <ArrowLeft size={20} />
          </Link>
          <span className="font-bold text-lg text-gray-900 dark:text-white">{siteConfig.brand.emoji} {siteConfig.brand.name}</span>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8">
        {/* Payment / Unlock Step */}
        {showPaymentStep && (
          <>
            {lead.photo_url && (
              <img src={lead.photo_url} alt="Job" className="w-full h-64 object-cover rounded-2xl mb-6" />
            )}

            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {lead.service_types.map((id) => siteConfig.serviceTypes.find((s) => s.id === id)?.label ?? id).join(", ")}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1 text-sm">
                  <MapPin size={14} /> {preUnlockAddress}
                </p>
                <p className="text-gray-400 flex items-center gap-1 text-xs mt-1">
                  <Clock size={12} /> {new Date(lead.created_at).toLocaleDateString()}
                </p>
              </div>
              <Badge variant={lead.status === "new" ? "green" : "blue"}>{lead.status}</Badge>
            </div>

            {lead.customer && (
              <Card data-testid="contact-masked" className="p-4 mb-4 flex items-center gap-3 dark:bg-gray-800 dark:border-gray-700">
                <Lock size={18} className="text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{lead.customer.name}</p>
                  <p className="text-xs text-gray-400">Full contact info hidden until you unlock this lead</p>
                </div>
              </Card>
            )}

            {lead.details && formatDetailsSummary(lead.details).length > 0 && (
              <Card className="p-5 mb-6 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Job Details</h3>
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
                  {formatDetailsSummary(lead.details).map((line) => <li key={line}>{line}</li>)}
                </ul>
              </Card>
            )}

            {siteConfig.features.aiAnalysis && lead.analysis_data && (
              <div className="mb-6">
                <AnalysisDisplay data={lead.analysis_data} />
              </div>
            )}

            {isFull ? (
              <Card className="p-6 text-center dark:bg-gray-800 dark:border-gray-700">
                <p className="font-semibold text-gray-900 dark:text-white mb-1">This lead is fully claimed</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {siteConfig.maxContractorsPerLead} contractors have already unlocked this lead. Check back for new leads.
                </p>
              </Card>
            ) : (
              <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                    <CreditCard className="text-primary" size={20} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">Unlock This Lead</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Reveal contact info & submit your quote</p>
                  </div>
                </div>

                <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Pay to unlock</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">One-time payment via Stripe</p>
                    </div>
                    <span className="text-2xl font-bold text-gray-900 dark:text-white">${(priceCents / 100).toFixed(2)}</span>
                  </div>
                </div>

                {showCanceledNotice && (
                  <div className="bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-3 mb-4 text-sm text-gray-600 dark:text-gray-300">
                    Payment was canceled. Try again below.
                  </div>
                )}

                {paymentError && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-3 mb-4 text-sm text-red-600">
                    {paymentError}
                  </div>
                )}

                <Button data-testid="pay-with-stripe" onClick={handlePayment} disabled={paymentLoading} className="w-full mb-3" size="lg">
                  {paymentLoading ? "Redirecting to Stripe..." : (
                    <span className="flex items-center gap-2"><CreditCard size={18} /> Pay ${(priceCents / 100).toFixed(2)} with Stripe</span>
                  )}
                </Button>

                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200 dark:border-gray-700" /></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-white dark:bg-gray-800 px-2 text-gray-400">or</span></div>
                </div>

                <Button
                  data-testid="unlock-with-credit"
                  onClick={handleCreditUnlock}
                  disabled={creditLoading || leadCredits < 1}
                  variant="secondary"
                  className="w-full"
                  size="lg"
                >
                  <span className="flex items-center gap-2">
                    <Zap size={18} />
                    {leadCredits < 1
                      ? "No lead credits remaining"
                      : creditLoading ? "Unlocking..." : `Unlock with 1 credit (${leadCredits} available)`}
                  </span>
                </Button>

                <p className="text-xs text-gray-400 text-center mt-3">
                  Founding contractors get free lead credits. Contact {siteConfig.brand.supportEmail} for more.
                </p>
              </Card>
            )}
          </>
        )}

        {/* Quote Form (after unlock) */}
        {hasAccess && (
          <>
            <div className="bg-primary/10 border border-primary/30 rounded-xl p-4 mb-6 flex items-center gap-3">
              <CheckCircle className="text-primary" size={20} />
              <div>
                <p className="font-semibold text-primary-dark dark:text-primary">Lead unlocked!</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">You now have full contact info and can submit a quote.</p>
              </div>
            </div>

            {lead.photo_url && (
              <img src={lead.photo_url} alt="Job" className="w-full h-64 object-cover rounded-2xl mb-6" />
            )}

            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                  {lead.service_types.map((id) => siteConfig.serviceTypes.find((s) => s.id === id)?.label ?? id).join(", ")}
                </h1>
                <p className="text-gray-500 dark:text-gray-400 flex items-center gap-1 text-sm">
                  <MapPin size={14} /> {lead.address}
                </p>
              </div>
              <Badge variant={lead.status === "new" ? "green" : "blue"}>{lead.status}</Badge>
            </div>

            {lead.customer && (
              <Card data-testid="contact-unlocked" className="p-4 mb-4 dark:bg-gray-800 dark:border-gray-700">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Contact</p>
                <p className="font-semibold text-gray-900 dark:text-white">{lead.customer.name}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {lead.customer.phone}{lead.customer.email ? ` · ${lead.customer.email}` : ""}
                </p>
              </Card>
            )}

            {lead.details && formatDetailsSummary(lead.details).length > 0 && (
              <Card className="p-5 mb-6 dark:bg-gray-800 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Job Details</h3>
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
                  {formatDetailsSummary(lead.details).map((line) => <li key={line}>{line}</li>)}
                </ul>
              </Card>
            )}

            {siteConfig.features.aiAnalysis && lead.analysis_data && (
              <div className="mb-6">
                <AnalysisDisplay data={lead.analysis_data} />
              </div>
            )}

            <QuoteForm lead={lead} onSubmit={handleSubmitQuote} priceCents={priceCents} />
          </>
        )}
      </div>
    </main>
  );
}

export default function QuotePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center text-gray-400">Loading...</div>}>
      <QuotePageContent />
    </Suspense>
  );
}
