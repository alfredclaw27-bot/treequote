/**
 * Contact-info masking for contractor-facing lead views.
 * Customer contact info stays hidden until a contractor unlocks the lead
 * (via Stripe checkout or a free lead credit).
 */

export function maskCustomerName(fullName?: string | null): string {
  if (!fullName || !fullName.trim()) return "Customer";
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0];
  if (parts.length === 1) return first;
  const lastInitial = parts[parts.length - 1][0]?.toUpperCase();
  return lastInitial ? `${first} ${lastInitial}.` : first;
}

export const MASKED_PHONE = "•••-•••-••••";
export const MASKED_EMAIL = "Hidden until unlocked";

export interface MaskableCustomer {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
}

/**
 * Returns a customer object safe to send to a contractor who has not
 * unlocked the lead: first name + last initial only, contact fields hidden.
 */
export function maskCustomer<T extends MaskableCustomer>(customer: T): T {
  return {
    ...customer,
    name: maskCustomerName(customer.name),
    phone: MASKED_PHONE,
    email: MASKED_EMAIL,
  };
}
