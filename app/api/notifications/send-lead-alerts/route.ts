import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendLeadAlerts } from "@/lib/notifications";

/**
 * POST /api/notifications/send-lead-alerts
 * Triggered after a lead is created. Finds matching contractors and sends them emails.
 * 
 * Body: { leadId: string }
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { leadId } = body;

  if (!leadId) {
    return NextResponse.json({ error: "leadId is required" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  // Fetch the lead
  const { data: lead, error: leadError } = await supabase
    .from("tq_leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // Send notifications to matching contractors
  const result = await sendLeadAlerts(lead);

  // Record notifications sent in the lead record
  await supabase
    .from("tq_leads")
    .update({
      notifications_sent: result.sent,
      notification_targets: result.contractors,
    })
    .eq("id", leadId);

  return NextResponse.json({
    success: true,
    ...result,
  });
}

/**
 * GET /api/notifications/send-lead-alerts?leadId=xxx
 * Manual re-send of alerts for an existing lead
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("leadId");

  if (!leadId) {
    return NextResponse.json({ error: "leadId is required" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  const { data: lead, error: leadError } = await supabase
    .from("tq_leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const result = await sendLeadAlerts(lead);

  return NextResponse.json({
    success: true,
    ...result,
  });
}
