import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2026-03-25.dahlia",
});

export async function createLeadPaymentIntent(amountCents: number, leadId: string, contractorId: string) {
  return stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    metadata: { leadId, contractorId },
  });
}

export const LEAD_PRICE_CENTS = parseInt(process.env.LEAD_PRICE_CENTS ?? "1000", 10);
