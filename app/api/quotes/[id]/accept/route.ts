import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendQuoteAcceptedEmail } from "@/lib/email";

/**
 * POST /api/quotes/[id]/accept
 * Marks a quote as accepted and notifies the contractor. Folds the update +
 * the quote-accepted email into one server-side call (the "Accept" button
 * used to update `tq_quotes` directly from the browser).
 */
export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServiceClient();

  const { data: quote, error } = await supabase
    .from("tq_quotes")
    .update({ status: "accepted" })
    .eq("id", id)
    .select("*, lead:tq_leads(customer:tq_customers(name)), contractor:tq_contractors(business_name, email)")
    .single();

  if (error || !quote) {
    return NextResponse.json({ error: error?.message || "Quote not found" }, { status: 404 });
  }

  const contractor = quote.contractor as unknown as { business_name?: string; email?: string } | null;
  const lead = quote.lead as unknown as { customer?: { name?: string } } | null;

  if (contractor?.email) {
    try {
      await sendQuoteAcceptedEmail({
        to: contractor.email,
        contractorName: contractor.business_name || "there",
        leadId: quote.lead_id,
        customerName: lead?.customer?.name || "A customer",
        amount: quote.amount,
      });
    } catch (e) {
      console.error("[Quotes] Failed to send quote-accepted email:", e);
    }
  }

  return NextResponse.json(quote);
}
