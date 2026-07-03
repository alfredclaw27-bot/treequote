import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!sig || !webhookSecret) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  switch (event.type) {
    case "payment_intent.succeeded": {
      const paymentIntent = event.data.object;
      const { leadId, contractorId } = paymentIntent.metadata;

      // Update lead as paid
      if (leadId) {
        await supabase
          .from("tq_leads")
          .update({ stripe_payment_id: paymentIntent.id })
          .eq("id", leadId);
      }

      // Store payment on quote if exists
      if (leadId && contractorId) {
        await supabase
          .from("tq_quotes")
          .update({ stripe_payment_id: paymentIntent.id })
          .eq("lead_id", leadId)
          .eq("contractor_id", contractorId);
      }
      break;
    }
    case "payment_intent.payment_failed": {
      const paymentIntent = event.data.object;
      console.log("Payment failed:", paymentIntent.id);
      break;
    }
  }

  return NextResponse.json({ received: true });
}
