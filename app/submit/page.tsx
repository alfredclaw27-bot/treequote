"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PhotoUploader } from "@/components/PhotoUploader";
import { ServiceSelector } from "@/components/ServiceSelector";
import { LocationInput } from "@/components/LocationInput";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Lead } from "@/types";

const STEPS = ["Photos", "Service", "Tree Details", "Location", "Contact", "Review"];

export default function SubmitPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Form state
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [treeDetails, setTreeDetails] = useState({
    height: "",
    treeType: "",
    stumpDiameter: "",
    stumpRemoval: false,
    equipmentAccess: "",
    nearFence: false,
    nearStructure: false,
    nearPowerLines: false,
    clippings: "haul_away",
    notes: "",
  });
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [contact, setContact] = useState({ name: "", phone: "", email: "" });

  const canNext = () => {
    if (step === 0) return photoUrls.length > 0;
    if (step === 1) return serviceTypes.length > 0;
    if (step === 2) return treeDetails.height && treeDetails.treeType;
    if (step === 3) return address.length > 5;
    if (step === 4) return contact.name && contact.phone;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");

    try {
      // Create or get customer
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
          service_types: serviceTypes,
          address,
          latitude: latitude ?? null,
          longitude: longitude ?? null,
          status: "new",
          analysis_data: { treeDetails, customerName: contact.name, customerPhone: contact.phone },
        })
        .select("id")
        .single();

      if (leadError || !lead) {
        setError("Failed to submit. Please try again.");
        setSubmitting(false);
        return;
      }

      // Fire-and-forget: AI analysis + notifications
      const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://tree-service-lead-gen.vercel.app";
      fetch(`${baseUrl}/api/leads/${lead.id}/analyze`, { method: "POST" }).catch(() => {});
      fetch(`${baseUrl}/api/notifications/send-lead-alerts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ leadId: lead.id }),
      }).catch(() => {});

      router.push(`/submitted?ref=${lead.id}`);
    } catch {
      setError("Something went wrong. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-6 py-4 flex items-center justify-between">
          <span className="font-bold text-xl text-gray-900">🌳 TreeQuote</span>
          <span className="text-sm text-gray-400">Step {step + 1} of {STEPS.length}</span>
        </div>
        {/* Progress */}
        <div className="flex gap-1 px-6 pb-3">
          {STEPS.map ((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${i <= step ? "bg-green-500" : "bg-gray-200"}`}
            />
          ))}
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-8">
        {/* Step indicator */}
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{STEPS[step]}</h1>
        <p className="text-gray-400 text-sm mb-6">
          {step === 0 && "Upload photos of the tree(s) you need service on"}
          {step === 1 && "Select the type of service you need"}
          {step === 2 && "Tell us about the tree's size and location"}
          {step === 3 && "Where is the tree located?"}
          {step === 4 && "How can contractors reach you?"}
          {step === 5 && "Review and submit your request"}
        </p>

        {/* Step 0: Photos */}
        {step === 0 && (
          <div>
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

        {/* Step 2: Tree Details */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Approximate tree height</label>
              <div className="grid grid-cols-2 gap-2">
                {["Under 20 ft", "20–40 ft", "40–60 ft", "Over 60 ft", "Not sure"].map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setTreeDetails((p) => ({ ...p, height: h }))}
                    className={`py-3 px-3 rounded-xl border-2 text-sm font-medium transition-all ${treeDetails.height === h ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tree type</label>
              <div className="grid grid-cols-2 gap-2">
                {["Oak", "Pine", "Maple", "Birch", "Willow", "Palm", "Other / Not sure"].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTreeDetails((p) => ({ ...p, treeType: t }))}
                    className={`py-3 px-3 rounded-xl border-2 text-sm font-medium transition-all ${treeDetails.treeType === t ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Stump situation</label>
              <div className="grid grid-cols-3 gap-2">
                {[["no_stump", "No stump"], ["has_stump", "Has stump"], ["already_removed", "Already removed"]].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTreeDetails((p) => ({ ...p, stumpDiameter: val }))}
                    className={`py-3 px-3 rounded-xl border-2 text-sm font-medium transition-all ${treeDetails.stumpDiameter === val ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {treeDetails.stumpDiameter === "has_stump" && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Stump diameter (if known)</label>
                <div className="grid grid-cols-4 gap-2">
                  {["Under 12 in", "12–24 in", "24–36 in", "Over 36 in"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setTreeDetails((p) => ({ ...p, stumpDiameter: d }))}
                      className={`py-2.5 px-2 rounded-xl border-2 text-xs font-medium transition-all ${treeDetails.stumpDiameter === d ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Equipment access</label>
              <div className="grid grid-cols-2 gap-2">
                {["Wide open yard", "Narrow passage", "Behind fence", "Crane required", "Not sure"].map((e) => (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setTreeDetails((p) => ({ ...p, equipmentAccess: e }))}
                    className={`py-3 px-3 rounded-xl border-2 text-sm font-medium transition-all ${treeDetails.equipmentAccess === e ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                  >
                    {e}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Site conditions</label>
              <div className="space-y-2">
                {[
                  { key: "nearFence", label: "Near fence or gate" },
                  { key: "nearStructure", label: "Near house or structure" },
                  { key: "nearPowerLines", label: "Near power lines" },
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={treeDetails[key as keyof typeof treeDetails] as boolean}
                      onChange={(e) => setTreeDetails((p) => ({ ...p, [key]: e.target.checked }))}
                      className="w-5 h-5 rounded border-gray-300 text-green-600"
                    />
                    <span className="text-sm text-gray-700">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">What to do with clippings?</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  ["haul_away", "Haul away"],
                  ["leave_chips", "Leave as mulch"],
                  ["keep_logs", "Keep logs"],
                ].map(([val, label]) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setTreeDetails((p) => ({ ...p, clippings: val }))}
                    className={`py-3 px-3 rounded-xl border-2 text-sm font-medium transition-all ${treeDetails.clippings === val ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Additional notes <span className="text-gray-400 font-normal">(optional)</span></label>
              <textarea
                value={treeDetails.notes}
                onChange={(e) => setTreeDetails((p) => ({ ...p, notes: e.target.value }))}
                placeholder="Anything else contractors should know..."
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <LocationInput value={address} onChange={(addr) => { setAddress(addr); }} />
        )}

        {/* Step 4: Contact */}
        {step === 4 && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
              <input
                type="text"
                value={contact.name}
                onChange={(e) => setContact((p) => ({ ...p, name: e.target.value }))}
                placeholder="John Smith"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone number</label>
              <input
                type="tel"
                value={contact.phone}
                onChange={(e) => setContact((p) => ({ ...p, phone: e.target.value }))}
                placeholder="(555) 867-5309"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-gray-400 font-normal">(optional)</span></label>
              <input
                type="email"
                value={contact.email}
                onChange={(e) => setContact((p) => ({ ...p, email: e.target.value }))}
                placeholder="john@example.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="space-y-4">
            <Card className="p-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">Photos</p>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photoUrls.map((url, i) => (
                  <img key={i} src={url} alt={`Photo ${i + 1}`} className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
                ))}
              </div>
            </Card>
            <Card className="p-4 space-y-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Service</p>
              <div className="flex flex-wrap gap-2">
                {serviceTypes.map((s) => (
                  <span key={s} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">{s}</span>
                ))}
              </div>
              <p className="text-sm text-gray-600">{address}</p>
            </Card>
            <Card className="p-4 space-y-2">
              <p className="text-xs text-gray-400 uppercase tracking-wide">Contact</p>
              <p className="font-medium">{contact.name}</p>
              <p className="text-sm text-gray-500">{contact.phone}{contact.email && ` · ${contact.email}`}</p>
            </Card>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-sm text-green-800">
              📸 Your photos will be analyzed by AI to help contractors give accurate quotes.
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button
              variant="secondary"
              onClick={() => setStep((s) => s - 1)}
              className="flex-1"
            >
              ← Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={!canNext()}
              className="flex-1"
            >
              Continue
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
      </div>
    </main>
  );
}
