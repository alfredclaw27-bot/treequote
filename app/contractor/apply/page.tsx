"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { siteConfig } from "@/config/site";
import { Loader2, Building2, MapPin, Phone, Sun, Moon } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export default function ContractorApplyPage() {
  const router = useRouter();
  const supabase = createClient();
  const { resolvedTheme, setTheme } = useTheme();
  const [form, setForm] = useState({
    email: "",
    password: "",
    businessName: "",
    phone: "",
    serviceArea: "",
    specialties: [] as string[],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const toggleSpecialty = (id: string) => {
    setForm((f) => ({
      ...f,
      specialties: f.specialties.includes(id)
        ? f.specialties.filter((s) => s !== id)
        : [...f.specialties, id],
    }));
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user returned");

      const { error: contractorError } = await supabase.from("tq_contractors").insert({
        id: authData.user.id,
        email: form.email,
        business_name: form.businessName,
        phone: form.phone || null,
        service_area: form.serviceArea.split(",").map((s) => s.trim()).filter(Boolean),
        specialties: form.specialties,
        approved: false,
      });

      if (contractorError) throw contractorError;

      try {
        await fetch("/api/contractors/welcome", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: form.email, businessName: form.businessName }),
        });
      } catch {
        // Email failure is non-critical
      }

      router.push("/contractor/pending");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-sm font-medium">
            ← Back
          </Link>
          <span className="font-bold text-lg text-gray-900 dark:text-white">{siteConfig.brand.emoji} {siteConfig.brand.name}</span>
          <button
            onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {resolvedTheme === "dark" ? <Sun size={18} className="text-gray-400" /> : <Moon size={18} className="text-gray-500" />}
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent-dark dark:text-accent rounded-full text-sm font-medium mb-3">
            <Building2 size={14} /> For Contractors
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Contractor Application</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Apply to start receiving qualified leads in your area. Review within 24 hours. {siteConfig.contractorPitch.foundingCalloutTitle}.
          </p>
        </div>

        <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
          <form onSubmit={handleApply} className="space-y-5">
            <Input
              id="businessName"
              label="Business Name"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              placeholder="ABC Services Inc."
              required
            />
            <Input
              id="email"
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="contact@example.com"
              required
            />
            <Input
              id="password"
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Create a secure password"
              required
            />
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} style={{ top: "calc(50% + 4px)" }} />
              <Input
                id="phone"
                label="Phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="(404) 555-0100"
                className="pl-11"
              />
            </div>
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                <MapPin size={16} className="text-gray-400" /> Service Area
              </label>
              <Input
                id="serviceArea"
                value={form.serviceArea}
                onChange={(e) => setForm({ ...form, serviceArea: e.target.value })}
                placeholder="Turnersville, NJ · Sewell, NJ · Cherry Hill, NJ"
              />
              <p className="text-xs text-gray-400 mt-1.5">Comma-separated list of cities or zip codes you serve</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Specialties</p>
              <div className="flex flex-wrap gap-2">
                {siteConfig.serviceTypes.map(({ id, label, icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleSpecialty(id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      form.specialties.includes(id)
                        ? "bg-primary/10 border-primary/40 text-primary-dark dark:text-primary"
                        : "bg-white border-gray-200 text-gray-600 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500"
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 text-sm">
              <p className="font-semibold text-accent-dark dark:text-accent mb-1">What happens after you apply?</p>
              <ul className="space-y-1 text-gray-700 dark:text-gray-300">
                <li>✓ We review your application (within 24 hours)</li>
                <li>✓ You receive an email when approved</li>
                <li>✓ Log in and start receiving leads!</li>
              </ul>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-2">{error}</p>
            )}

            <Button type="submit" className="w-full bg-accent hover:bg-accent-dark text-white" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </Card>

        <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/contractor/login" className="text-primary font-medium hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}