"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { siteConfig } from "@/config/site";
import { Loader2, Save, Truck } from "lucide-react";

const BUCKET_REACH_OPTIONS = [
  { value: "under_30ft", label: "Under 30 ft" },
  { value: "30_50ft", label: "30–50 ft" },
  { value: "50_75ft", label: "50–75 ft" },
  { value: "over_75ft", label: "75+ ft" },
  { value: "none", label: "No bucket truck" },
];

const CREW_SIZE_OPTIONS = [
  { value: "1", label: "Just me" },
  { value: "2", label: "2 people" },
  { value: "3-4", label: "3–4 people" },
  { value: "5-6", label: "5–6 people" },
  { value: "7plus", label: "7+ people" },
];

const EQUIPMENT_OPTIONS = [
  { id: "stump_grinder", label: "Stump Grinder", icon: "⚙️" },
  { id: "chipper", label: "Chipper", icon: "🌿" },
  { id: "climbing_gear", label: "Climbing Gear", icon: "🧗" },
  { id: "crane", label: "Crane / Lift", icon: "🏗️" },
];

export default function ContractorProfilePage() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [phone, setPhone] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [bucketReach, setBucketReach] = useState("");
  const [crewSize, setCrewSize] = useState("");
  const [equipment, setEquipment] = useState<string[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/contractor/login"); return; }

      const { data: contractor } = await supabase
        .from("tq_contractors")
        .select("*")
        .eq("id", user.id)
        .single();

      if (contractor) {
        setBusinessName(contractor.business_name ?? "");
        setPhone(contractor.phone ?? "");
        setServiceArea((contractor.service_area ?? []).join(", "));
        setSpecialties(contractor.specialties ?? []);
        const eq = contractor.equipment ?? {};
        setBucketReach(eq.bucketReach ?? "");
        setCrewSize(eq.crewSize ?? "");
        setEquipment(eq.equipment ?? []);
      }
      setLoading(false);
    };
    load();
  }, [supabase, router]);

  const toggleSpecialty = (id: string) => {
    setSpecialties((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]);
  };

  const toggleEquipment = (id: string) => {
    setEquipment((e) => e.includes(id) ? e.filter((x) => x !== id) : [...e, id]);
  };

  const handleSave = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("tq_contractors").update({
      business_name: businessName,
      phone: phone || null,
      service_area: serviceArea.split(",").map((s) => s.trim()).filter(Boolean),
      specialties,
      equipment: { bucketReach, crewSize, equipment },
    }).eq("id", user.id);

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-400" size={40} />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => router.push("/contractor/dashboard")} className="text-gray-500 hover:text-gray-700 font-medium">
            ← Back
          </button>
          <span className="font-bold text-lg text-gray-900">{siteConfig.brand.emoji} {siteConfig.brand.name}</span>
          <div className="w-16" />
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Equipment & Profile</h1>
          <p className="text-gray-500 text-sm mt-1">This helps us match you with the right leads.</p>
        </div>

        {/* Business Info */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <span>🏢</span> Business Info
          </h2>
          <Input
            label="Business Name"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            placeholder="ABC Services Inc."
          />
          <Input
            label="Phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(404) 555-0100"
          />
          <Input
            label="Service Area (zip codes or cities)"
            value={serviceArea}
            onChange={(e) => setServiceArea(e.target.value)}
            placeholder="Atlanta, GA · Marietta, GA · Roswell, GA"
          />
        </Card>

        {/* Specialties */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <span>✨</span> Specialties
          </h2>
          <div className="flex flex-wrap gap-2">
            {siteConfig.serviceTypes.map(({ id, label, icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => toggleSpecialty(id)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                  specialties.includes(id)
                    ? "bg-primary/10 border-primary/40 text-primary-dark"
                    : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                {icon} {label}
              </button>
            ))}
          </div>
        </Card>

        {/* Equipment */}
        <Card className="p-6 space-y-4">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Truck size={18} /> Equipment
          </h2>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Bucket Truck Reach</p>
            <div className="flex flex-wrap gap-2">
              {BUCKET_REACH_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setBucketReach(value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    bucketReach === value
                      ? "bg-primary/10 border-primary/40 text-primary-dark"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Crew Size</p>
            <div className="flex flex-wrap gap-2">
              {CREW_SIZE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setCrewSize(value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    crewSize === value
                      ? "bg-primary/10 border-primary/40 text-primary-dark"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Available Equipment</p>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map(({ id, label, icon }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggleEquipment(id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    equipment.includes(id)
                      ? "bg-primary/10 border-primary/40 text-primary-dark"
                      : "bg-white border-gray-200 text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {icon} {label}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {saved && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
            <p className="text-green-700 font-medium">✅ Profile saved!</p>
          </div>
        )}

        <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
          {saving ? <Loader2 className="animate-spin mr-2" size={18} /> : <Save className="mr-2" size={18} />}
          {saving ? "Saving..." : "Save Profile"}
        </Button>
      </div>
    </main>
  );
}