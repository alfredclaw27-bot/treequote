"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { PhotoUploader } from "@/components/PhotoUploader";
import { ServiceSelector } from "@/components/ServiceSelector";
import { LocationInput } from "@/components/LocationInput";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, ArrowRight, CheckCircle, Loader2, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

const STEPS = ["Photo", "Service", "Location", "Contact", "Review"];

export default function SubmitPage() {
  const router = useRouter();
  const supabase = createClient();
  const { resolvedTheme, setTheme } = useTheme();
  const [step, setStep] = useState(0);
  const [photoUrl, setPhotoUrl] = useState("");
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const canProceed = () => {
    switch (step) {
      case 0: return !!photoUrl;
      case 1: return serviceTypes.length > 0;
      case 2: return address.length > 3;
      case 3: return name.length > 0;
      default: return true;
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      // 1. Create or get customer
      const { data: customer, error: customerError } = await supabase
        .from("customers")
        .insert({ name, email: email || null, phone: phone || null })
        .select()
        .single();

      if (customerError) throw customerError;

      // 2. Create lead
      const { data: lead, error: leadError } = await supabase
        .from("leads")
        .insert({
          customer_id: customer.id,
          photo_url: photoUrl,
          service_types: serviceTypes,
          address,
          status: "new",
        })
        .select()
        .single();

      if (leadError) throw leadError;

      // 3. Trigger AI analysis
      try {
        await fetch(`/api/leads/${lead.id}/analyze`, { method: "POST" });
      } catch {
        // Analysis is non-critical; lead is still created
      }

      // 4. Send confirmation email (non-critical)
      if (customer.email) {
        try {
          await fetch("/api/customers/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: customer.email,
              customerName: customer.name,
              leadId: lead.id,
              serviceTypes,
              address,
            }),
          });
        } catch { /* email failure is non-critical */ }
      }

      // 5. Redirect to confirmation
      router.push(`/submitted?leadId=${lead.id}`);
    } catch (err) {
      console.error("Submit error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 dark:text-gray-300">
            <ArrowLeft size={20} />
            <span className="font-medium">Back</span>
          </Link>
          <span className="font-bold text-lg text-gray-900 dark:text-white">🌳 TreeQuote</span>
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <Sun size={18} className="text-gray-400" /> : <Moon size={18} className="text-gray-500" />}
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-8">
        {/* Progress */}
        <div className="step-indicator mb-8">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`step-dot ${i === step ? "active" : i < step ? "completed" : ""}`}
            />
          ))}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {step === 0 && "Upload a Photo"}
          {step === 1 && "What needs to be done?"}
          {step === 2 && "Where is the tree?"}
          {step === 3 && "How do we reach you?"}
          {step === 4 && "Review & Submit"}
        </h1>
        <p className="text-gray-500 text-sm mb-8">Step {step + 1} of {STEPS.length}</p>

        {/* Step 0: Photo */}
        {step === 0 && (
          <div className="space-y-4">
            <PhotoUploader onUploaded={setPhotoUrl} currentUrl={photoUrl} />
            <p className="text-xs text-gray-400 text-center">
              Take a clear photo of the tree that needs work. Include as much of the tree as possible.
            </p>
          </div>
        )}

        {/* Step 1: Service */}
        {step === 1 && (
          <div className="space-y-4">
            <ServiceSelector selected={serviceTypes} onChange={setServiceTypes} />
          </div>
        )}

        {/* Step 2: Location */}
        {step === 2 && (
          <div className="space-y-4">
            <LocationInput value={address} onChange={setAddress} />
          </div>
        )}

        {/* Step 3: Contact */}
        {step === 3 && (
          <div className="space-y-4">
            <Input
              id="name"
              label="Your Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Smith"
              required
            />
            <Input
              id="phone"
              label="Phone Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(404) 555-0100"
            />
            <Input
              id="email"
              label="Email (optional)"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="john@example.com"
            />
          </div>
        )}

        {/* Step 4: Review */}
        {step === 4 && (
          <div className="space-y-4">
            <Card className="p-5 space-y-4">
              {photoUrl && (
                <img src={photoUrl} alt="Tree" className="w-full h-48 object-cover rounded-xl" />
              )}
              <div className="space-y-2 text-sm">
                <ReviewRow label="Services" value={serviceTypes.join(", ")} />
                <ReviewRow label="Location" value={address} />
                <ReviewRow label="Name" value={name} />
                {phone && <ReviewRow label="Phone" value={phone} />}
                {email && <ReviewRow label="Email" value={email} />}
              </div>
            </Card>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <p className="text-sm text-green-700 font-medium">✅ Free for customers — no obligation</p>
              <p className="text-xs text-green-600 mt-1">Contractors in your area will be notified. Expect quotes within 24 hours.</p>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-500 mt-4">{error}</p>}

        {/* Navigation */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button variant="secondary" onClick={() => setStep(step - 1)} className="flex-1">
              <ArrowLeft size={18} className="mr-1" /> Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="flex-1"
            >
              Next <ArrowRight size={18} className="ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1"
            >
              {submitting ? <Loader2 className="animate-spin mr-2" size={18} /> : <CheckCircle className="mr-2" size={18} />}
              {submitting ? "Submitting..." : "Submit — It's Free!"}
            </Button>
          )}
        </div>
      </div>
    </main>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-gray-500">{label}</span>
      <span className="font-medium text-gray-900 capitalize">{value}</span>
    </div>
  );
}
