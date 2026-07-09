"use client";

/**
 * Client-side demo-mode helpers. Demo mode (no Supabase needed) lets
 * anyone click "Explore Demo Account" on the contractor login page and try
 * the full lead-unlock flow, including masked contact info and spending
 * free lead credits — all tracked in localStorage.
 */

import { appSlug, demoModeKey } from "@/config/site";

const DEMO_FLAG_KEY = demoModeKey;
const DEMO_UNLOCKED_KEY = `${appSlug}_demo_unlocked`;
const DEMO_CREDITS_KEY = `${appSlug}_demo_credits`;
const DEMO_LEADS_KEY = `${appSlug}_demo_leads`;

/**
 * Whether a real Supabase backend is configured. When it isn't (fresh
 * clone, local demo), customer submissions are simulated client-side
 * instead of erroring out against the placeholder Supabase URL.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL);
}

const MAX_STORED_DATA_URL_LENGTH = 60_000; // ~44KB decoded — a downscaled thumbnail, never a full-size photo

/**
 * Downscales a data: URL to a small JPEG thumbnail via an offscreen canvas.
 * Used so demo-mode photo previews never persist a full-size (multi-MB)
 * base64 image into localStorage, which has a hard ~5-10MB per-origin quota.
 */
async function downscaleDataUrl(dataUrl: string, maxDim = 200): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
        const w = Math.max(1, Math.round(img.naturalWidth * scale));
        const h = Math.max(1, Math.round(img.naturalHeight * scale));
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("2D canvas context unavailable"));
          return;
        }
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL("image/jpeg", 0.6));
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error("Failed to decode image for thumbnailing"));
    img.src = dataUrl;
  });
}

/**
 * Reduces a list of photo URLs to something safe to persist in localStorage.
 * Real remote URLs (Supabase storage configured) are left as-is — they're
 * cheap strings. Any inline `data:` URL (the fallback used when Supabase
 * storage isn't configured — see PhotoUploader) is replaced with a small
 * downscaled thumbnail for the cover photo only; the rest are dropped in
 * favor of a plain count. This is the fix for the production bug where a
 * real phone photo (several MB, base64-inflated ~1.37x) blew the ~5MB
 * localStorage quota, threw an uncaught QuotaExceededError, and left the
 * submit button stuck at "Submitting..." forever.
 */
export async function makeStorablePhotoUrls(
  urls: string[]
): Promise<{ photo_urls: string[]; photo_count: number }> {
  const photo_count = urls.length;
  if (urls.length === 0) return { photo_urls: [], photo_count };

  const hasInlineData = urls.some((u) => u.startsWith("data:"));
  if (!hasInlineData) {
    // All real remote URLs — cheap to store as-is.
    return { photo_urls: urls, photo_count };
  }

  const cover = urls[0];
  try {
    const thumb = cover.startsWith("data:") ? await downscaleDataUrl(cover) : cover;
    return { photo_urls: [thumb], photo_count };
  } catch {
    // Thumbnailing failed for any reason — never fall back to the
    // full-size data URL, just drop it and keep the count.
    return { photo_urls: [], photo_count };
  }
}

/**
 * Strips anything that could exceed localStorage's per-origin quota (full
 * base64 photo data URLs) from an arbitrary object before it's persisted.
 * Used defensively wherever a lead-shaped object might get written to
 * localStorage — see `saveDemoLead` and `saveDemoQuote`.
 */
function stripLargeDataUrls<T extends Record<string, unknown>>(obj: T): T {
  const clone: Record<string, unknown> = { ...obj };
  if (Array.isArray(clone.photo_urls)) {
    delete clone.photo_urls;
  }
  if (typeof clone.photo_url === "string" && clone.photo_url.length > MAX_STORED_DATA_URL_LENGTH) {
    clone.photo_url = "";
  }
  return clone as T;
}

export function saveDemoLead(lead: Record<string, unknown>): void {
  try {
    const existing = JSON.parse(localStorage.getItem(DEMO_LEADS_KEY) ?? "[]");
    localStorage.setItem(DEMO_LEADS_KEY, JSON.stringify([...existing, lead]));
  } catch {
    // Quota exceeded (or any other storage error) — retry once with large
    // data stripped out rather than losing the lead entirely. If even that
    // fails, give up silently: demo persistence is a nice-to-have, but a
    // failed localStorage write must never block the submit flow.
    try {
      const safeLead = stripLargeDataUrls(lead);
      const existing = JSON.parse(localStorage.getItem(DEMO_LEADS_KEY) ?? "[]");
      localStorage.setItem(DEMO_LEADS_KEY, JSON.stringify([...existing, safeLead]));
    } catch {
      try {
        localStorage.setItem(DEMO_LEADS_KEY, JSON.stringify([stripLargeDataUrls(lead)]));
      } catch {
        // Storage is unusable (quota exceeded even for a tiny payload,
        // private browsing, etc) — nothing more we can safely do here.
        console.warn("[demo] Unable to persist demo lead to localStorage; continuing without it.");
      }
    }
  }
}

export function getDemoLeads(): Record<string, unknown>[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DEMO_LEADS_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function findDemoLead(leadId: string): Record<string, unknown> | undefined {
  return getDemoLeads().find((l) => l.id === leadId);
}

const STARTING_DEMO_CREDITS = 2;

export function isDemoMode(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(DEMO_FLAG_KEY) === "contractor";
}

/**
 * Demo mode also needs to survive the server-side auth gate in `proxy.ts`
 * (Next 16's middleware), which can't read localStorage — only cookies —
 * so we mirror the flag into a cookie too.
 */
export function enterDemoMode(): void {
  localStorage.setItem(DEMO_FLAG_KEY, "contractor");
  document.cookie = `${DEMO_FLAG_KEY}=contractor; path=/; max-age=86400; samesite=lax`;
}

export function exitDemoMode(): void {
  localStorage.removeItem(DEMO_FLAG_KEY);
  document.cookie = `${DEMO_FLAG_KEY}=; path=/; max-age=0`;
}

export function getDemoUnlockedLeadIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DEMO_UNLOCKED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

export function isDemoLeadUnlocked(leadId: string): boolean {
  return getDemoUnlockedLeadIds().includes(leadId);
}

export function unlockDemoLead(leadId: string): void {
  const ids = getDemoUnlockedLeadIds();
  if (!ids.includes(leadId)) {
    localStorage.setItem(DEMO_UNLOCKED_KEY, JSON.stringify([...ids, leadId]));
  }
}

const DEMO_QUOTES_KEY = `${appSlug}_demo_quotes`;

export function getDemoQuotes(): Record<string, unknown>[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(DEMO_QUOTES_KEY) ?? "[]");
  } catch {
    return [];
  }
}

/**
 * `quote` typically embeds the full `lead` it was written for (see
 * app/contractor/quote/[leadId]/page.tsx) so the customer/dashboard views
 * don't have to re-fetch it. That embedded lead can carry the same
 * quota-busting `photo_urls` data URLs `saveDemoLead` guards against, so
 * strip them here too before writing to localStorage.
 */
export function saveDemoQuote(quote: Record<string, unknown>): void {
  const safeQuote: Record<string, unknown> = { ...quote };
  if (safeQuote.lead && typeof safeQuote.lead === "object") {
    safeQuote.lead = stripLargeDataUrls(safeQuote.lead as Record<string, unknown>);
  }

  try {
    localStorage.setItem(DEMO_QUOTES_KEY, JSON.stringify([safeQuote, ...getDemoQuotes()]));
  } catch {
    // Still over quota even without the lead's photos (e.g. many prior
    // quotes already stored) — never let a storage failure bubble up and
    // hang the caller's submit flow.
    try {
      localStorage.setItem(DEMO_QUOTES_KEY, JSON.stringify([safeQuote]));
    } catch {
      console.warn("[demo] Unable to persist demo quote to localStorage; continuing without it.");
    }
  }
}

export function getDemoCredits(): number {
  if (typeof window === "undefined") return STARTING_DEMO_CREDITS;
  const raw = localStorage.getItem(DEMO_CREDITS_KEY);
  if (raw === null) {
    localStorage.setItem(DEMO_CREDITS_KEY, String(STARTING_DEMO_CREDITS));
    return STARTING_DEMO_CREDITS;
  }
  return parseInt(raw, 10);
}

export function spendDemoCredit(): number {
  const remaining = Math.max(0, getDemoCredits() - 1);
  localStorage.setItem(DEMO_CREDITS_KEY, String(remaining));
  return remaining;
}
