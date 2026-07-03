import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/client";
import { LEAD_PRICE_CENTS } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  try {
    const { leadId } = await req.json();

    if (!leadId) {
      return NextResponse.json({ error: "leadId is required" }, { status: 400 });
    }

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const origin = req.headers.get("origin") ?? "http://localhost:3000";

    // Check if this contractor already paid for this lead
    const { data: existingAccess } = await supabase
      .from("tq_lead_access")
      .select("*")
      .eq("lead_id", leadId)
      .eq("contractor_id", user.id)
      .eq("payment_status", "completed")
      .single();

    if (existingAccess) {
      return NextResponse.json({ already_paid: true, access_id: existingAccess.id });
    }

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "TreeQuote Lead Access",
              description: `Access to view contact info for lead ${leadId}`,
            },
            unit_amount: LEAD_PRICE_CENTS,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${origin}/contractor/quote/${leadId}?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url: `${origin}/contractor/quote/${leadId}?canceled=true`,
      metadata: {
        leadId,
        contractorId: user.id,
      },
      customer_email: user.email ?? undefined,
    });

    // Record pending lead access
    await supabase.from("tq_lead_access").insert({
      lead_id: leadId,
      contractor_id: user.id,
      stripe_session_id: session.id,
      payment_status: "pending",
    });

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}