import type { NextRequest } from "next/server";
import { adminCookieKey } from "@/config/site";

/**
 * Server-side supply-side outreach helpers for the admin CRM
 * (app/admin/**, app/api/admin/outreach/**). GTM Phase 1: for each incoming
 * lead (or a freeform area search), find nearby tree-service companies via
 * the Google Places API "New" and track manual call/email outreach against
 * them until enough contractors have joined to run ads.
 *
 * The Places call shape is ported from scripts/find-contractors.mjs — same
 * endpoint, same field mask.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OutreachStatus =
  | "found"
  | "contacted"
  | "no_answer"
  | "responded"
  | "joined"
  | "declined";

export const OUTREACH_STATUSES: OutreachStatus[] = [
  "found",
  "contacted",
  "no_answer",
  "responded",
  "joined",
  "declined",
];

export const OUTREACH_STATUS_LABELS: Record<OutreachStatus, string> = {
  found: "Found",
  contacted: "Contacted",
  no_answer: "No Answer",
  responded: "Responded",
  joined: "Joined",
  declined: "Declined",
};

export interface OutreachContractor {
  id: string;
  lead_id: string | null;
  source: string;
  name: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  rating: number | null;
  review_count: number | null;
  address: string | null;
  maps_url: string | null;
  status: OutreachStatus;
  notes: string | null;
  contacted_at: string | null;
  created_at: string;
  updated_at: string;
}

/** A normalized Places result, before it's upserted into tq_outreach_contractors. */
export interface PlacesResult {
  name: string;
  phone: string | null;
  website: string | null;
  rating: number | null;
  review_count: number | null;
  address: string | null;
  maps_url: string | null;
}

// ---------------------------------------------------------------------------
// Places API (New) — Text Search
// ---------------------------------------------------------------------------

const PLACES_FIELD_MASK =
  "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri,places.businessStatus";

export class PlacesConfigError extends Error {}

/**
 * Text-searches Google Places for local businesses. Requires
 * GOOGLE_PLACES_API_KEY — throws PlacesConfigError if it isn't set so
 * callers can surface a clean 400 instead of a raw fetch failure.
 */
export async function searchPlaces(query: string, limit = 20): Promise<PlacesResult[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    throw new PlacesConfigError("GOOGLE_PLACES_API_KEY not configured");
  }

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask": PLACES_FIELD_MASK,
    },
    body: JSON.stringify({
      textQuery: query,
      maxResultCount: Math.min(20, Math.max(1, limit)),
      regionCode: "US",
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Places API ${res.status}: ${body}`);
  }

  const data = await res.json();
  const places: unknown[] = data.places || [];

  return places.map((raw) => {
    const p = raw as {
      displayName?: { text?: string };
      nationalPhoneNumber?: string;
      websiteUri?: string;
      rating?: number;
      userRatingCount?: number;
      formattedAddress?: string;
      googleMapsUri?: string;
    };
    return {
      name: p.displayName?.text || "Unknown",
      phone: p.nationalPhoneNumber || null,
      website: p.websiteUri || null,
      rating: typeof p.rating === "number" ? p.rating : null,
      review_count: typeof p.userRatingCount === "number" ? p.userRatingCount : null,
      address: p.formattedAddress || null,
      maps_url: p.googleMapsUri || null,
    };
  });
}

// ---------------------------------------------------------------------------
// Admin auth
// ---------------------------------------------------------------------------

/**
 * Mirrors the /admin gate in proxy.ts (which only covers page routes, not
 * /api/admin/**, per its `matcher`). Same rule: when ADMIN_SECRET isn't set
 * (local dev), everything is open; when it is set, the request must carry
 * either the admin cookie proxy.ts sets after `/admin?key=...`, or an
 * `X-Admin-Secret` header with the same value (for non-browser callers).
 */
export function isAdminRequest(req: NextRequest): boolean {
  const adminSecret = process.env.ADMIN_SECRET;
  if (!adminSecret) return true;

  const cookieValue = req.cookies.get(adminCookieKey)?.value;
  if (cookieValue === adminSecret) return true;

  const headerValue = req.headers.get("x-admin-secret");
  if (headerValue === adminSecret) return true;

  return false;
}
