import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/client";

export async function GET(req: NextRequest) {
  try {
    const sessionId = req.nextUrl.searchParams.get("session_id");
    const leadId = req.nextUrl.searchParams.get("lead_id");

    if (!sessionId || !leadId) {
      return NextResponse.json({ error: "Missing session_id or lead_id" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the Stripe checkout session
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json({ error: "Payment not completed" }, { status: 400 });
    }

    // Update lead_access record to completed
    const { error } = await supabase
      .from("lead_access")
      .update({
        payment_status: "completed",
        stripe_payment_id: session.payment_intent as string,
      })
      .eq("stripe_session_id", sessionId)
      .eq("contractor_id", user.id);

    if (error) {
      console.error("Failed to update lead_access:", error);
    }

    return NextResponse.json({
      success: true,
      hasAccess: true,
      customerEmail: session.customer_email,
    });
  } catch (err) {
    console.error("Verify session error:", err);
    return NextResponse.json({ error: "Failed to verify session" }, { status: 500 });
  }
}