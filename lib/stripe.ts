import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "sk_test_placeholder", {
  apiVersion: "2026-03-25.dahlia",
});

export function isStripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  return !!key && key !== "sk_test_placeholder";
}

export async function createLeadPaymentIntent(amountCents: number, leadId: string, contractorId: string) {
  return stripe.paymentIntents.create({
    amount: amountCents,
    currency: "usd",
    metadata: { leadId, contractorId },
  });
}
