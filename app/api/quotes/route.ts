import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { sendQuoteReceivedEmail } from "@/lib/email";

export async function GET(req: NextRequest) {
  const supabase = await createServiceClient();
  const { searchParams } = new URL(req.url);
  const contractorId = searchParams.get("contractor_id");

  let query = supabase
    .from("tq_quotes")
    .select("*, lead:tq_leads(*), contractor:tq_contractors(*)")
    .order("created_at", { ascending: false });

  if (contractorId) {
    query = query.eq("contractor_id", contractorId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

/**
 * POST /api/quotes
 * Submits a contractor's quote on a lead. Folds the insert + the
 * quote-received customer notification into one server-side call (the quote
 * form used to insert directly from the browser).
 */
export async function POST(req: NextRequest) {
  const authClient = await createClient();
  const { data: { user } } = await authClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createServiceClient();
  const body = await req.json();

  const { lead_id, contractor_id, amount, notes, estimated_date } = body;

  if (!lead_id || !contractor_id || !amount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (contractor_id !== user.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { data, error } = await supabase
    .from("tq_quotes")
    .insert({
      lead_id,
      contractor_id,
      amount,
      notes: notes || null,
      estimated_date: estimated_date || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update lead status
  await supabase.from("tq_leads").update({ status: "quoted" }).eq("id", lead_id);

  // Fire-and-forget: let the customer know a quote came in. No-ops
  // gracefully without RESEND_API_KEY (see lib/email.ts).
  (async () => {
    try {
      const [{ data: lead }, { data: contractor }] = await Promise.all([
        supabase.from("tq_leads").select("service_types, customer:tq_customers(name, email)").eq("id", lead_id).single(),
        supabase.from("tq_contractors").select("business_name").eq("id", contractor_id).single(),
      ]);
      const customer = lead?.customer as unknown as { name?: string; email?: string } | null;
      if (customer?.email) {
        await sendQuoteReceivedEmail({
          to: customer.email,
          customerName: customer.name || "there",
          leadId: lead_id,
          serviceTypes: lead?.service_types ?? [],
          contractorName: contractor?.business_name || "A contractor",
        });
      }
    } catch (e) {
      console.error("[Quotes] Failed to send quote-received email:", e);
    }
  })();

  return NextResponse.json(data, { status: 201 });
}
