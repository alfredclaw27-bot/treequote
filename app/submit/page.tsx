"use client";
import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PhotoUploader } from "@/components/PhotoUploader";
import { ServiceSelector } from "@/components/ServiceSelector";
import { LocationInput } from "@/components/LocationInput";
import { DetailsForm } from "@/components/DetailsForm";
import { formatDetailsSummary } from "@/lib/details";
import { isSupabaseConfigured, saveDemoLead, makeStorablePhotoUrls } from "@/lib/demo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { siteConfig } from "@/config/site";
import type { LeadDetails } from "@/types";

const STEPS = ["Photos", "Service", "Details", "Location", "Contact", "Review"];

export default function SubmitPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [details, setDetails] = useState<LeadDetails>({});
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });
  // Reported by DetailsForm so the top progress bar can subdivide step 2
  // ("Question 3 of 8" etc) into its own sub-progress.
  const [detailsProgress, setDetailsProgress] = useState({ index: 0, total: 1 });

  const handleAddressChange = (addr: string, coords?: { lat: number; lon: number }) => {
    setAddress(addr);
    setLatitude(coords?.lat ?? null);
    setLongitude(coords?.lon ?? null);
  };

  const handleDetailsProgress = useCallback((index: number, total: number) => {
    setDetailsProgress({ index, total: Math.max(total, 1) });
  }, []);

  const handleDetailsComplete = useCallback(() => setStep(3), []);
  const handleDetailsBack = useCallback(() => setStep(1), []);

  const canNext = () => {
    if (step === 0) return photoUrls.length > 0;
    if (step === 1) return serviceTypes.length > 0;
    // Step 2 (Details) drives its own navigation via DetailsForm's
    // Back/Next — the generic wizard nav below is hidden for that step.
    if (step === 3) return address.length > 5;
    if (step === 4) return contact.name && contact.phone;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    // No backend configured (fresh clone / local demo) — simulate success
    // instead of failing against the placeholder Supabase URL.
    if (!isSupabaseConfigured()) {
      const demoId = `demo-${Date.now().toString(36)}`;
      const emailParam = contact.email ? "1" : "0";
      // Wrapped end-to-end: with real phone photos, PhotoUploader's
      // preview fallback (used whenever Supabase storage isn't configured)
      // can be a multi-MB base64 data URL. Persisting that straight to
      // localStorage used to throw an uncaught QuotaExceededError here,
      // which left `submitting` stuck true and the button stuck at
      // "Submitting..." forever. Demo-mode persistence is a nice-to-have —
      // losing it is fine, hanging the customer is not.
      try {
        const { photo_urls, photo_count } = await makeStorablePhotoUrls(photoUrls);
        saveDemoLead({
          id: demoId,
          photo_url: photo_urls[0] ?? "",
          photo_urls,
          photo_count,
          service_types: serviceTypes,
          address,
          latitude,
          longitude,
          details,
          status: "new",
          created_at: new Date().toISOString(),
          customer: contact,
        });
      } catch (err) {
        console.error("Demo lead save failed (continuing to confirmation anyway):", err);
      }
      router.push(`/submitted?ref=${demoId}&email=${emailParam}`);
      return;
    }

    try {
      // Create customer
      const { data: customer, error: customerError } = await supabase
        .from("tq_customers")
        .insert({ name: contact.name, phone: contact.phone, email: contact.email || null })
        .select("id")
        .single();

      if (customerError || !customer) {
        setError("Failed to save your information. Please try again.");
        setSubmitting(false);
        return;
      }

      // Create lead
      const { data: lead, error: leadError } = await supabase
        .from("tq_leads")
        .insert({
          customer_id: customer.id,
          photo_url: photoUrls[0] ?? "",
          photo_urls: photoUrls,
          service_types: serviceTypes,
          address,
          latitude,
          longitude,
          status: "new",
          details,
        })
        .select("id")
        .single();

      if (leadError || !lead) {
        setError("Failed to submit. Please try again.");
        setSubmitting(false);
        return;
      }

      // Fire-and-forget: contractor notifications + customer confirmation email
      const baseUrl = typeof window !== "undefined" ? window.location.origin : `https://${siteConfig.brand.domain}`;
      if (siteConfig.features.aiAnalysis) {
        fetch(`${baseUrl}/api/leads/${lead.id}/analyze`, { method: "POST" }).catch(() => {});
      }
      fetch(`${baseUrl}/api/notifications/send-lead-alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      }).catch(() => {});
      fetch(`${baseUrl}/api/customers/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: contact.email,
          customerName: contact.name,
          leadId: lead.id,
          serviceTypes,
          address,
        }),
      }).catch(() => {});

      router.push(`/submitted?ref=${lead.id}&email=${contact.email ? "1" : "0"}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="font-bold text-xl text-gray-900 dark:text-white">
            {siteConfig.brand.emoji} {siteConfig.brand.name}
          </Link>
          <span className="text-sm text-gray-400">Step {step + 1} of {STEPS.length}</span>
        </div>
        {/* Progress — step 2 (Details) subdivides its segment by sub-question progress */}
        <div className="flex gap-1 px-6 pb-3">
          {STEPS.map((_, i) => {
            let fillPct = 0;
            if (i < step) fillPct = 100;
            else if (i === step) {
              fillPct = i === 2 ? Math.round(((detailsProgress.index + 1) / detailsProgress.total) * 100) : 100;
            }
            return (
              <div
                key={i}
                data-testid="progress-step"
                className="h-1 flex-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
              >
                <div className="h-full bg-primary transition-all" style={{ width: `${fillPct}%` }} />
              </div>
            );
          })}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-8">
        {/* Step indicator */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{STEPS[step]}</h1>
        {step !== 2 && (
          <p className="text-gray-400 text-sm mb-6">
            {step === 0 && `Upload photos of the ${siteConfig.itemNounSingular}(s) you need service on`}
            {step === 1 && "Select the type of service you need"}
            {step === 3 && "Where is the job located?"}
            {step === 4 && "How can contractors reach you?"}
            {step === 5 && "Review and submit your request"}
          </p>
        )}

        {/* Step 0: Photos */}
        {step === 0 && (
          <div>
            <p className="text-xs text-gray-400 mb-4">{siteConfig.wizardMicrocopy.momentumLine}</p>
            <PhotoUploader onUploaded={(urls) => setPhotoUrls(urls)} currentUrls={photoUrls} />
            {photoUrls.length > 0 && (
              <p className="text-xs text-gray-400 mt-2 text-center">{photoUrls.length} photo{photoUrls.length !== 1 ? "s" : ""} selected</p>
            )}
          </div>
        )}

        {/* Step 1: Service */}
        {step === 1 && (
          <ServiceSelector selected={serviceTypes} onChange={setServiceTypes} />
        )}

        {/* Step 2: Details (config-driven, one question per page) */}
        {step === 2 && (
          <DetailsForm
            values={details}
            onChange={setDetails}
            onComplete={handleDetailsComplete}
            onBack={handleDetailsBack}
            onProgress={handleDetailsProgress}
          />
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <LocationInput value={address} onChange={handleAddressChange} />
        )}

        {/* Step 4: Contact */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your name</label>
              <input
                type="text"
                value={contact.name}
                onChange={(e) => setContact((p) => ({ ...p, name: e.target.value }))}
                placeholder="John Smith"
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone number</label>
              <input
                type="tel"
                value={contact.phone}
                onChange={(e) => setContact((p) => ({ ...p, phone: e.target.value }))}
                placeholder="(555) 867-5309"
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="email"
                value={contact.email}
                onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))}
                placeholder="john@example.com"
                className="w-full border border-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <p className="text-xs text-gray-400">{siteConfig.wizardMicrocopy.contactTrustLine}</p>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="space-y-4">
            <Card className="p-4 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Photos</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photoUrls.map((url, i) => (
                  <img key={i} src={url} alt={`Photo ${i + 1}`} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                ))}
              </div>
            </Card>
            <Card className="p-4 space-y-2 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Service</p>
              <div className="flex flex-wrap gap-2">
                {serviceTypes.map((s) => (
                  <span key={s} className="px-3 py-1 bg-primary/10 text-primary-dark dark:text-primary rounded-full text-sm font-medium">
                    {siteConfig.serviceTypes.find((st) => st.id === s)?.label ?? s}
                  </span>
                ))}
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">{address}</p>
            </Card>
            {formatDetailsSummary(details).length > 0 && (
              <Card className="p-4 space-y-1 dark:bg-gray-800 dark:border-gray-700">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Details</p>
                {formatDetailsSummary(details).map((line) => (
                  <p key={line} className="text-sm text-gray-600 dark:text-gray-300">{line}</p>
                ))}
              </Card>
            )}
            <Card className="p-4 space-y-2 dark:bg-gray-800 dark:border-gray-700">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Contact</p>
              <p className="font-medium text-gray-900 dark:text-white">{contact.name}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{contact.phone}{contact.email && ` · ${contact.email}`}</p>
            </Card>
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-sm text-primary-dark dark:text-primary">
              {siteConfig.wizardMicrocopy.reviewReassurance}
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Navigation — step 2 (Details) owns its own Back/Next inside DetailsForm */}
        {step !== 2 && (
        <div className="flex gap-3 mt-8">
          {step > 0 ? (
            <Button
              variant="secondary"
              onClick={() => setStep((s) => s - 1)}
              className="flex-1"
            >
              ← Back
            </Button>
          ) : (
            <Link href="/" className="flex-1">
              <Button variant="secondary" className="w-full">← Back</Button>
            </Link>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="flex-1"
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={!canNext() || submitting}
              className="flex-1"
            >
              {submitting ? "Submitting..." : "Submit Request"}
            </Button>
          )}
        </div>
        )}
      </div>
    </main>
  );
}
