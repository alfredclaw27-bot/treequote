import { NextRequest, NextResponse } from "next/server";
import { stripe, isStripeConfigured } from "@/lib/stripe";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { contractorHasUnlocked, isLeadFull } from "@/lib/lead-access";
import { getLeadPriceCents, siteConfig } from "@/config/site";

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

    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: "Payments are not configured yet. Ask an admin for a free lead credit instead." },
        { status: 503 }
      );
    }

    const origin = req.headers.get("origin") ?? "http://localhost:3000";

    if (await contractorHasUnlocked(leadId, user.id)) {
      return NextResponse.json({ already_paid: true });
    }

    if (await isLeadFull(leadId)) {
      return NextResponse.json(
        { error: `This lead has already been unlocked by ${siteConfig.maxContractorsPerLead} contractors.` },
        { status: 409 }
      );
    }

    const service = await createServiceClient();
    const { data: lead } = await service.from("tq_leads").select("service_types").eq("id", leadId).single();
    const priceCents = getLeadPriceCents(lead?.service_types ?? []);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: `${siteConfig.brand.name} Lead Access`,
              description: `Access to view contact info for lead ${leadId}`,
            },
            unit_amount: priceCents,
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
    await service.from("tq_lead_access").upsert(
      {
        lead_id: leadId,
        contractor_id: user.id,
        stripe_session_id: session.id,
        payment_status: "pending",
        unlock_method: "stripe",
      },
      { onConflict: "lead_id,contractor_id" }
    );

    return NextResponse.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json({ error: "Failed to create checkout session" }, { status: 500 });
  }
}
