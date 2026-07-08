import { createServiceClient } from "@/lib/supabase/server";
import { siteConfig } from "@/config/site";

/**
 * Shared helpers for the "unlock a lead" flow. A lead can be unlocked by up
 * to `siteConfig.maxContractorsPerLead` contractors, either via Stripe
 * checkout or by spending a free lead credit.
 */

export async function getCompletedUnlockCount(leadId: string): Promise<number> {
  const supabase = await createServiceClient();
  const { count } = await supabase
    .from("tq_lead_access")
    .select("id", { count: "exact", head: true })
    .eq("lead_id", leadId)
    .eq("payment_status", "completed");
  return count ?? 0;
}

export async function contractorHasUnlocked(leadId: string, contractorId: string): Promise<boolean> {
  const supabase = await createServiceClient();
  const { data } = await supabase
    .from("tq_lead_access")
    .select("id")
    .eq("lead_id", leadId)
    .eq("contractor_id", contractorId)
    .eq("payment_status", "completed")
    .maybeSingle();
  return !!data;
}

export async function isLeadFull(leadId: string): Promise<boolean> {
  const count = await getCompletedUnlockCount(leadId);
  return count >= siteConfig.maxContractorsPerLead;
}
