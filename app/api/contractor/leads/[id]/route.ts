import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { maskCustomer } from "@/lib/masking";
import { maskAddressToCity } from "@/lib/details";
import { getCompletedUnlockCount, contractorHasUnlocked } from "@/lib/lead-access";
import { siteConfig } from "@/config/site";
import type { Lead } from "@/types";

/**
 * GET /api/contractor/leads/[id]
 * Single-lead detail for the contractor quote/unlock page, with contact
 * info masked unless the requesting contractor has unlocked it.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const service = await createServiceClient();
  const { data: lead, error } = await service
    .from("tq_leads")
    .select("*, customer:tq_customers(*)")
    .eq("id", id)
    .single();

  if (error || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const [unlocked, unlockCount, { data: contractor }] = await Promise.all([
    contractorHasUnlocked(id, user.id),
    getCompletedUnlockCount(id),
    service.from("tq_contractors").select("lead_credits, is_founding").eq("id", user.id).single(),
  ]);

  const typedLead = lead as Lead;

  return NextResponse.json({
    lead: {
      ...typedLead,
      // Full street address is only revealed once a contractor has unlocked
      // the lead — before that, only city/state goes out over the wire.
      address: unlocked ? typedLead.address : maskAddressToCity(typedLead.address),
      unlocked,
      unlock_count: unlockCount,
      is_full: unlockCount >= siteConfig.maxContractorsPerLead,
      customer: typedLead.customer && !unlocked ? maskCustomer(typedLead.customer) : typedLead.customer,
    },
    contractor: contractor ?? { lead_credits: 0, is_founding: false },
  });
}
