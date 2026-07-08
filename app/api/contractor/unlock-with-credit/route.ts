import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { contractorHasUnlocked, isLeadFull } from "@/lib/lead-access";
import { siteConfig } from "@/config/site";

/**
 * POST /api/contractor/unlock-with-credit
 * Alternative to Stripe checkout: spend one lead credit to unlock a lead.
 * Body: { leadId: string }
 */
export async function POST(req: NextRequest) {
  try {
    const { leadId } = await req.json();
    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const service = await createServiceClient();

    // Already unlocked? No-op success.
    if (await contractorHasUnlocked(leadId, user.id)) {
      return NextResponse.json({ success: true, already_unlocked: true });
    }

    if (await isLeadFull(leadId)) {
      return NextResponse.json(
        { error: `This lead has already been unlocked by ${siteConfig.maxContractorsPerLead} contractors.` },
        { status: 409 }
      );
    }

    const { data: contractor, error: contractorError } = await service
      .from("tq_contractors")
      .select("id, lead_credits")
      .eq("id", user.id)
      .single();

    if (contractorError || !contractor) {
      return NextResponse.json({ error: "Contractor profile not found" }, { status: 404 });
    }

    if ((contractor.lead_credits ?? 0) < 1) {
      return NextResponse.json({ error: "No lead credits remaining" }, { status: 402 });
    }

    const { error: accessError } = await service.from("tq_lead_access").upsert(
      {
        lead_id: leadId,
        contractor_id: user.id,
        payment_status: "completed",
        unlock_method: "credit",
      },
      { onConflict: "lead_id,contractor_id" }
    );

    if (accessError) {
      return NextResponse.json({ error: accessError.message }, { status: 500 });
    }

    await service
      .from("tq_contractors")
      .update({ lead_credits: contractor.lead_credits - 1 })
      .eq("id", user.id);

    return NextResponse.json({ success: true, remaining_credits: contractor.lead_credits - 1 });
  } catch (err) {
    console.error("Credit unlock error:", err);
    return NextResponse.json({ error: "Failed to unlock lead" }, { status: 500 });
  }
}
