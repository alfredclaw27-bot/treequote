import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { maskCustomer } from "@/lib/masking";
import { siteConfig } from "@/config/site";
import type { Lead } from "@/types";

/**
 * GET /api/contractor/leads
 * Returns recent leads for the authenticated contractor's dashboard, with
 * customer contact info masked unless the contractor has unlocked the lead
 * (via Stripe checkout or a lead credit).
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = await createServiceClient();

  const [{ data: leads }, { data: myAccess }, { data: allAccessCounts }] = await Promise.all([
    service
      .from("tq_leads")
      .select("*, customer:tq_customers(*)")
      .order("created_at", { ascending: false })
      .limit(50),
    service
      .from("tq_lead_access")
      .select("lead_id")
      .eq("contractor_id", user.id)
      .eq("payment_status", "completed"),
    service.from("tq_lead_access").select("lead_id").eq("payment_status", "completed"),
  ]);

  const unlockedSet = new Set((myAccess ?? []).map((a: { lead_id: string }) => a.lead_id));
  const unlockCounts = new Map<string, number>();
  for (const row of allAccessCounts ?? []) {
    unlockCounts.set(row.lead_id, (unlockCounts.get(row.lead_id) ?? 0) + 1);
  }

  const result = ((leads ?? []) as Lead[]).map((lead) => {
    const unlocked = unlockedSet.has(lead.id);
    const unlock_count = unlockCounts.get(lead.id) ?? 0;
    return {
      ...lead,
      unlocked,
      unlock_count,
      is_full: unlock_count >= siteConfig.maxContractorsPerLead,
      customer: lead.customer && !unlocked ? maskCustomer(lead.customer) : lead.customer,
    };
  });

  return NextResponse.json({ leads: result });
}
