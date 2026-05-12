"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PhotoUploader } from "@/components/PhotoUploader";
import { ServiceSelector } from "@/components/ServiceSelector";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, MapPin, Ruler, TreeDeciduous } from "lucide-react";

const STEPS = ["Photos", "Service", "Tree Details", "Location", "Contact", "Review"];

interface TreeDetails {
  height: string;
  treeType: string;
  stumpDiameter: string;
  hasStump: string;
  accessType: string;
  fencePresent: boolean | null;
  nearStructure: boolean | null;
  nearPowerLines: boolean | null;
  clippingsAction: string;
  additionalNotes: string;
}

const HEIGHT_OPTIONS = ["Under 20 ft", "20–35 ft", "35–50 ft", "50–75 ft", "75+ ft", "Not sure"];
const TREE_TYPE_OPTIONS = ["Oak", "Pine", "Maple", "Palm", "Cypress", "Birch", "Magnolia", "Other / Not sure"];
const STUMP_OPTIONS = ["No stump (tree still standing)", "Yes — needs grinding", "Already has stump", "Not applicable"];
const ACCESS_OPTIONS = ["Wide driveway / open yard", "Narrow access (< 8ft)", "Fenced yard", "Near house/structure", "Limited — crane needed"];
const CLIPPINGS_OPTIONS = ["Chip and haul away", "Leave as mulch on site", "Leave logs for me to keep", "No clippings"];

export default function SubmitPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState(0);
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [treeDetails, setTreeDetails] = useState<TreeDetails>({
    height: "", treeType: "", stumpDiameter: "", hasStump: "",
    accessType: "", fencePresent: null, nearStructure: null, nearPowerLines: null,
    clippingsAction: "", additionalNotes: "",
  });
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canProceed = () => {
    switch (step) {
      case 0: return photoUrls.length > 0;
      case 1: return serviceTypes.length > 0;
      case 2: return treeDetails.height && treeDetails.accessType && treeDetails.clippingsAction;
      case 3: return address.length > 5;
      case 4: return name.length > 0;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      // 1. Create customer
      const { data: customer, error: customerError } = await supabase
        .from("tq_customers")
        .insert({ name, email: email || null, phone: phone || null })
        .select("id")
        .single();

      if (customerError) throw customerError;

      // 2. Build analysis data from tree details
      const analysisData = {
        height: treeDetails.height,
        treeType: treeDetails.treeType,
        stumpDiameter: treeDetails.stumpDiameter,
        hasStump: treeDetails.hasStump,
        accessType: treeDetails.accessType,
        fencePresent: treeDetails.fencePresent,
        nearStructure: treeDetails.nearStructure,
        nearPowerLines: treeDetails.nearPowerLines,
        clippingsAction: treeDetails.clippingsAction,
        photosCount: photoUrls.length,
        notes: treeDetails.additionalNotes,
      };

      // 3. Create lead
      const { data: lead, error: leadError } = await supabase
        .from("tq_leads")
        .insert({
          customer_id: customer.id,
          photo_url: photoUrls[0] ?? "",
          analysis_data: analysisData,
          service_types: serviceTypes,
          address,
          status: "new",
        })
        .select("id")
        .single();

      if (leadError) throw leadError;

      // 4. Upload additional photos to lead record if needed
      if (photoUrls.length > 1) {
        await supabase
          .from("tq_leads")
          .update({ photo_url: photoUrls.join(",") })
          .eq("id", lead.id);
      }

      // 5. Trigger AI analysis (fire-and-forget)
      fetch(`/api/leads/${lead.id}/analyze`, { method: "POST" }).catch(() => {});

      router.push(`/submitted?leadId=${lead.id}`);
    } catch (err) {
      console.error("Submit error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const updateTree = (key: keyof TreeDetails, value: string | boolean | null) => {
    setTreeDetails((prev) => ({ ...prev, [key]: value }));
  };

  const SelectionGrid = ({ options, selected, onChange, label }: {
    options: string[]; selected: string; onChange: (v: string) => void; label?: string;
  }) => (
    <div className="space-y-2">
      {label && <p className="text-sm font-medium text-gray-700">{label}</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className={`p-3 rounded-xl border-2 text-left text-sm font-medium transition-all ${
              selected === opt
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );

  const YesNo = ({ value, onChange, label }: { value: boolean | null; onChange: (v: boolean | null) => void; label: string }) => (
    <div className="flex items-center gap-3">
      <span className="text-sm text-gray-600 flex-1">{label}</span>
      {[["Yes", true], ["No", false], ["Not sure", null]].map(([label, val]) => (
        <button
          key={String(val)}
          type="button"
          onClick={() => onChange(val as boolean | null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition-all ${
            value === val ? "border-green-500 bg-green-50 text-green-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </Link>
          <span className="font-bold text-lg text-gray-900">🌳 TreeQuote</span>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-8">
        <div className="step-indicator mb-8">
          {STEPS.map((_, i) => (
            <div key={i} className={`step-dot ${i === step ? "active" : i < step ? "completed" : ""}`} />
          ))}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">{STEPS[step]}</h1>
        <p className="text-gray-500 text-sm mb-8">Step {step + 1} of {STEPS.length}</p>

        {/* Step 0: Photos */}
        {step === 0 && (
          <div className="space-y-4">
            <PhotoUploader onUploaded={setPhotoUrls} currentUrls={photoUrls} />
            {photoUrls.length > 0 && (
              <p className="text-sm text-gray-500">
                {photoUrls.length} photo{photoUrls.length !== 1 ? "s" : ""} uploaded · Tap + to add more
              </p>
            )}
          </div>
        )}

        {/* Step 1: Service */}
        {step === 1 && (
          <div className="space-y-4">
            <ServiceSelector selected={serviceTypes} onChange={setServiceTypes} />
          </div>
        )}

        {/* Step 2: Tree Details */}
        {step === 2 && (
          <div className="space-y-6">
            <SelectionGrid
              label="Tree Height (estimated)"
              options={HEIGHT_OPTIONS}
              selected={treeDetails.height}
              onChange={(v) => updateTree("height", v)}
            />

            <SelectionGrid
              label="Tree Type (if you know it)"
              options={TREE_TYPE_OPTIONS}
              selected={treeDetails.treeType}
              onChange={(v) => updateTree("treeType", v)}
            />

            <SelectionGrid
              label="Stump Situation"
              options={STUMP_OPTIONS}
              selected={treeDetails.hasStump}
              onChange={(v) => updateTree("hasStump", v)}
            />

            {treeDetails.hasStump?.includes("grinding") && (
              <Input
                label="Approximate Stump Diameter (inches)"
                type="number"
                value={treeDetails.stumpDiameter}
                onChange={(e) => updateTree("stumpDiameter", e.target.value)}
                placeholder="e.g. 24"
              />
            )}

            <SelectionGrid
              label="Equipment Access"
              options={ACCESS_OPTIONS}
              selected={treeDetails.accessType}
              onChange={(v) => updateTree("accessType", v)}
            />

            <div className="space-y-3">
              <p className="text-sm font-medium text-gray-700">Site Conditions</p>
              <YesNo
                label="Fence around the tree?"
                value={treeDetails.fencePresent}
                onChange={(v) => updateTree("fencePresent", v)}
              />
              <YesNo
                label="House or structure within falling range?"
                value={treeDetails.nearStructure}
                onChange={(v) => updateTree("nearStructure", v)}
              />
              <YesNo
                label="Near power lines?"
                value={treeDetails.nearPowerLines}
                onChange={(v) => updateTree("nearPowerLines", v)}
              />
            </div>

            <SelectionGrid
              label="What should happen with clippings?"
              options={CLIPPINGS_OPTIONS}
              selected={treeDetails.clippingsAction}
              onChange={(v) => updateTree("clippingsAction", v)}
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Anything else contractors should know?</label>
              <textarea
                value={treeDetails.additionalNotes}
                onChange={(e) => updateTree("additionalNotes", e.target.value)}
                placeholder="e.g. debris in pool, special instructions, preferred timeline..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                rows={3}
              />
            </div>
          </div>
        )}

        {/* Step 3: Location */}
        {step === 3 && (
          <div className="space-y-4">
            <LocationInput value={address} onChange={setAddress} />
          </div>
        )}

        {/* Step 4: Contact */}
        {step === 4 && (
          <div className="space-y-4">
            <Input id="name" label="Your Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Smith" required />
            <Input id="phone" label="Phone Number" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(404) 555-0100" />
            <Input id="email" label="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" />
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="space-y-4">
            <Card className="p-5 space-y-3">
              {photoUrls[0] && <img src={photoUrls[0]} alt="Tree" className="w-full h-40 object-cover rounded-xl" />}
              {photoUrls.length > 1 && <p className="text-xs text-gray-500">+{photoUrls.length - 1} more photos</p>}
              <ReviewRow label="Services" value={serviceTypes.join(", ")} />
              <ReviewRow label="Height" value={treeDetails.height} />
              <ReviewRow label="Tree Type" value={treeDetails.treeType || "Not specified"} />
              <ReviewRow label="Stump" value={treeDetails.hasStump || "Not specified"} />
              {treeDetails.stumpDiameter && <ReviewRow label="Stump Diameter" value={`${treeDetails.stumpDiameter} inches`} />}
              <ReviewRow label="Access" value={treeDetails.accessType} />
              {treeDetails.fencePresent !== null && <ReviewRow label="Fence Present" value={treeDetails.fencePresent ? "Yes" : "No"} />}
              {treeDetails.nearStructure !== null && <ReviewRow label="Near Structure" value={treeDetails.nearStructure ? "Yes ⚠️" : "No"} />}
              {treeDetails.nearPowerLines !== null && <ReviewRow label="Near Power Lines" value={treeDetails.nearPowerLines ? "Yes ⚠️" : "No"} />}
              <ReviewRow label="Clippings" value={treeDetails.clippingsAction} />
              {treeDetails.additionalNotes && <ReviewRow label="Notes" value={treeDetails.additionalNotes} />}
              <ReviewRow label="Location" value={address} />
              <ReviewRow label="Name" value={name} />
              {phone && <ReviewRow label="Phone" value={phone} />}
              {email && <ReviewRow label="Email" value={email} />}
            </Card>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-700 font-medium">✅ Free for customers — contractors will be notified immediately</p>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-500 mt-4">{error}</p>}

        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep(step - 1)} className="flex-1">
              <ArrowLeft size={18} className="mr-1" /> Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep(step + 1)} disabled={!canProceed()} className="flex-1">
              Next <ArrowRight size={18} className="ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={submitting} className="flex-1">
              {submitting ? <><Loader2 className="animate-spin mr-2" size={18} />Submitting...</> : <><CheckCircle className="mr-2" size={18} />Submit — Free!</>}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

function LocationInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Tree Location</label>
      <div className="relative">
        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="123 Main St, Atlanta, GA"
          className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>
      <p className="text-xs text-gray-400">Enter the address where the tree is located</p>
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 text-right max-w-xs">{value}</span>
    </div>
  );
}
