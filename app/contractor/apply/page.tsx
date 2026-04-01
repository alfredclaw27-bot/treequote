"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { SERVICE_TYPES } from "@/types";
import { Loader2 } from "lucide-react";

export default function ContractorApplyPage() {
  const router = useRouter();
  const supabase = createClient();
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
      // Sign up via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error("No user returned");

      // Insert contractor record (approved: false)
      const { error: contractorError } = await supabase.from("contractors").insert({
        id: authData.user.id,
        email: form.email,
        business_name: form.businessName,
        phone: form.phone || null,
        service_area: form.serviceArea.split(",").map((s) => s.trim()).filter(Boolean),
        specialties: form.specialties,
        approved: false,
      });

      if (contractorError) throw contractorError;

      alert("Application submitted! We'll review and get back to you within 24 hours.");
      router.push("/contractor/login");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-gray-500 hover:text-gray-700 text-sm font-medium">
            ← Back
          </Link>
          <span className="font-bold text-lg text-gray-900">🌳 TreeQuote</span>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Contractor Application</h1>
        <p className="text-gray-500 text-sm mb-8">
          Apply to join our network. We review applications within 24 hours.
        </p>

        <Card className="p-6">
          <form onSubmit={handleApply} className="space-y-5">
            <Input
              id="businessName"
              label="Business Name"
              value={form.businessName}
              onChange={(e) => setForm({ ...form, businessName: e.target.value })}
              placeholder="ABC Tree Services"
              required
            />
            <Input
              id="email"
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="contact@abctrees.com"
              required
            />
            <Input
              id="password"
              label="Password"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Create a password"
              required
            />
            <Input
              id="phone"
              label="Phone"
              type="tel"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(404) 555-0100"
            />
            <Input
              id="serviceArea"
              label="Service Area"
              value={form.serviceArea}
              onChange={(e) => setForm({ ...form, serviceArea: e.target.value })}
              placeholder="Atlanta, GA · Marietta, GA · Roswell, GA"
            />
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Specialties</p>
              <div className="flex flex-wrap gap-2">
                {SERVICE_TYPES.map(({ id, label, icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => toggleSpecialty(id)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                      form.specialties.includes(id)
                        ? "bg-green-100 border-green-300 text-green-700"
                        : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                    }`}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
              {loading ? "Submitting..." : "Submit Application"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}
