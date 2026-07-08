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

export function saveDemoLead(lead: Record<string, unknown>): void {
  try {
    const existing = JSON.parse(localStorage.getItem(DEMO_LEADS_KEY) ?? "[]");
    localStorage.setItem(DEMO_LEADS_KEY, JSON.stringify([...existing, lead]));
  } catch {
    localStorage.setItem(DEMO_LEADS_KEY, JSON.stringify([lead]));
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

export function saveDemoQuote(quote: Record<string, unknown>): void {
  localStorage.setItem(DEMO_QUOTES_KEY, JSON.stringify([quote, ...getDemoQuotes()]));
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
