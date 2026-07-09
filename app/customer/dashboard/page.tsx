"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { siteConfig } from "@/config/site";
import { isSupabaseConfigured } from "@/lib/demo";
import type { Lead } from "@/types";
import { LogOut, Sparkles, MessageSquare, MapPin } from "lucide-react";

interface LeadWithQuoteCount extends Lead {
  quote_count: number;
}

const STATUS_VARIANT: Record<string, "green" | "blue" | "gray"> = {
  new: "green",
  quoted: "blue",
  closed: "gray",
};

function CustomerDashboardContent() {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [leads, setLeads] = useState<LeadWithQuoteCount[]>([]);
  const [email, setEmail] = useState("");

  useEffect(() => {
    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/customer/login");
        return;
      }
      setEmail(user.email ?? "");

      const orFilter = user.email ? `auth_user_id.eq.${user.id},email.eq.${user.email}` : `auth_user_id.eq.${user.id}`;

      const { data: customers } = await supabase.from("tq_customers").select("id").or(orFilter);
      const customerIds = (customers ?? []).map((c) => c.id);

      if (customerIds.length === 0) {
        setLoading(false);
        return;
      }

      const { data: leadsData } = await supabase
        .from("tq_leads")
        .select("*")
        .in("customer_id", customerIds)
        .order("created_at", { ascending: false });

      const leadIds = (leadsData ?? []).map((l) => l.id);
      const quoteCounts = new Map<string, number>();
      if (leadIds.length > 0) {
        const { data: quotes } = await supabase.from("tq_quotes").select("lead_id").in("lead_id", leadIds);
        for (const q of quotes ?? []) {
          quoteCounts.set(q.lead_id, (quoteCounts.get(q.lead_id) ?? 0) + 1);
        }
      }

      setLeads(
        ((leadsData ?? []) as Lead[]).map((l) => ({ ...l, quote_count: quoteCounts.get(l.id) ?? 0 }))
      );
      setLoading(false);
    };
    load();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/customer/login");
  };

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{siteConfig.brand.emoji}</span>
            <div>
              <span className="font-bold text-lg text-gray-900 dark:text-white">{siteConfig.brand.name}</span>
              <p className="text-xs text-gray-500 dark:text-gray-400">{email}</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut size={16} className="mr-1" /> Logout
          </Button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-1">My Requests</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Every {siteConfig.itemNounSingular} request you&apos;ve submitted, in one place.</p>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="p-4 h-20 animate-pulse bg-gray-100 dark:bg-gray-800" />
            ))}
          </div>
        ) : leads.length === 0 ? (
          <Card className="p-12 text-center dark:bg-gray-800 dark:border-gray-700">
            <p className="text-gray-400 text-lg mb-2">No requests yet</p>
            <p className="text-gray-400 text-sm mb-4">Submit a request and it&apos;ll show up here.</p>
            <Link href="/submit">
              <Button>Get a Free Quote</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-3">
            {leads.map((lead) => {
              const serviceLabels = (lead.service_types ?? [])
                .map((id) => siteConfig.serviceTypes.find((s) => s.id === id)?.label ?? id)
                .join(", ");
              return (
                <Link key={lead.id} href={`/customer/quotes/${lead.id}`}>
                  <Card className="p-4 flex items-center gap-4 dark:bg-gray-800 dark:border-gray-700 hover:shadow-md transition-shadow">
                    {lead.photo_url && (
                      <img src={lead.photo_url} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{serviceLabels || "Request"}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 truncate">
                        <MapPin size={12} /> {lead.address}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <MessageSquare size={12} /> {lead.quote_count} quote{lead.quote_count === 1 ? "" : "s"}
                      </p>
                    </div>
                    <Badge variant={STATUS_VARIANT[lead.status] ?? "gray"}>{lead.status}</Badge>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

export default function CustomerDashboardPage() {
  if (!isSupabaseConfigured()) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-2xl">{siteConfig.brand.emoji}</span>
            <span className="font-bold text-xl text-gray-900 dark:text-white">{siteConfig.brand.name}</span>
          </Link>
          <Card className="p-6 dark:bg-gray-800 dark:border-gray-700">
            <Sparkles className="mx-auto text-accent mb-3" size={28} />
            <p className="font-semibold text-gray-900 dark:text-white mb-1">Demo mode — accounts disabled</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              This is a demo install with no backend connected, so customer accounts aren&apos;t available.
            </p>
          </Card>
        </div>
      </main>
    );
  }

  return <CustomerDashboardContent />;
}
