#!/usr/bin/env node
// @ts-nocheck
/**
 * find-contractors — supply-side discovery for manual outreach.
 *
 * Takes an address/area and returns local tree-service companies with phone,
 * website, rating, and a best-effort email (scraped from their site). Built for
 * TreeQuote GTM Phase 1: build a call/email list before spending on ads.
 *
 * Usage:
 *   node scripts/find-contractors.mjs "Marietta, GA"
 *   node scripts/find-contractors.mjs "123 Peachtree St, Atlanta, GA" --limit 20 --keyword "tree removal"
 *   node scripts/find-contractors.mjs "Decatur, GA" --no-email        # skip website email scraping (faster)
 *
 * Requires GOOGLE_PLACES_API_KEY (Places API "New" enabled). The script reads it
 * from the environment or from .env.local in the project root.
 *
 * Output: prints a table and writes a CSV to ./contractor-lists/<timestamp>.csv
 */

import { readFileSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

// ---- args ----
const argv = process.argv.slice(2);
const flags = { limit: 20, keyword: "tree service", email: true };
const positional = [];
for (let i = 0; i < argv.length; i++) {
  const a = argv[i];
  if (a === "--limit") flags.limit = Math.min(20, parseInt(argv[++i], 10) || 20);
  else if (a === "--keyword") flags.keyword = argv[++i];
  else if (a === "--no-email") flags.email = false;
  else positional.push(a);
}
const location = positional.join(" ").trim();

if (!location) {
  console.error('Usage: node scripts/find-contractors.mjs "<address or city, state>" [--limit N] [--keyword "..."] [--no-email]');
  process.exit(1);
}

// ---- API key (env or .env.local) ----
function loadApiKey() {
  if (process.env.GOOGLE_PLACES_API_KEY) return process.env.GOOGLE_PLACES_API_KEY;
  const envPath = join(ROOT, ".env.local");
  if (existsSync(envPath)) {
    for (const line of readFileSync(envPath, "utf8").split("\n")) {
      const m = line.match(/^\s*GOOGLE_PLACES_API_KEY\s*=\s*(.+)\s*$/);
      if (m) return m[1].replace(/^["']|["']$/g, "").trim();
    }
  }
  return null;
}

const API_KEY = loadApiKey();
if (!API_KEY) {
  console.error("✗ GOOGLE_PLACES_API_KEY not set.\n");
  console.error("Get one: https://console.cloud.google.com → create a project → enable");
  console.error('  "Places API (New)" → Credentials → Create API key. Then add to .env.local:');
  console.error("  GOOGLE_PLACES_API_KEY=your_key_here\n");
  process.exit(1);
}

// ---- Places API (New) Text Search ----
async function searchPlaces() {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask":
        "places.displayName,places.formattedAddress,places.nationalPhoneNumber,places.websiteUri,places.rating,places.userRatingCount,places.googleMapsUri,places.businessStatus",
    },
    body: JSON.stringify({
      textQuery: `${flags.keyword} in ${location}`,
      maxResultCount: flags.limit,
      regionCode: "US",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Places API ${res.status}: ${body}`);
  }
  const data = await res.json();
  return data.places || [];
}

// ---- best-effort email scrape ----
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi;
const JUNK = /(sentry|wixpress|example\.com|\.png|\.jpg|\.gif|godaddy|squarespace|@sentry)/i;

async function scrapeEmail(website) {
  if (!website) return "";
  const candidates = [website];
  try {
    const u = new URL(website);
    candidates.push(`${u.origin}/contact`, `${u.origin}/contact-us`);
  } catch {
    return "";
  }
  for (const url of candidates) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 8000);
      const res = await fetch(url, {
        signal: ctrl.signal,
        headers: { "User-Agent": "Mozilla/5.0 (compatible; TreeQuoteOutreach/1.0)" },
      });
      clearTimeout(t);
      if (!res.ok) continue;
      const html = await res.text();
      const found = (html.match(EMAIL_RE) || []).filter((e) => !JUNK.test(e));
      if (found.length) return found.sort((a, b) => a.length - b.length)[0].toLowerCase();
    } catch {
      // ignore and try next candidate
    }
  }
  return "";
}

// ---- csv ----
function csvCell(v) {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

async function main() {
  console.log(`\n🔎 Searching "${flags.keyword}" near "${location}" (up to ${flags.limit})...\n`);
  const places = await searchPlaces();
  if (!places.length) {
    console.log("No results. Try a broader area or a different --keyword.");
    return;
  }

  const rows = [];
  for (const p of places) {
    const name = p.displayName?.text || "";
    const phone = p.nationalPhoneNumber || "";
    const website = p.websiteUri || "";
    const email = flags.email ? await scrapeEmail(website) : "";
    rows.push({
      name,
      phone,
      email,
      website,
      rating: p.rating ?? "",
      reviews: p.userRatingCount ?? "",
      address: p.formattedAddress || "",
      maps: p.googleMapsUri || "",
    });
    process.stdout.write(
      `  • ${name.padEnd(34).slice(0, 34)} ${String(phone).padEnd(16)} ${email || (flags.email ? "(no email)" : "")}\n`
    );
  }

  const header = ["name", "phone", "email", "website", "rating", "reviews", "address", "maps"];
  const csv = [header.join(","), ...rows.map((r) => header.map((h) => csvCell(r[h])).join(","))].join("\n");

  const outDir = join(ROOT, "contractor-lists");
  mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const slug = location.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);
  const outFile = join(outDir, `${slug || "search"}-${stamp}.csv`);
  writeFileSync(outFile, csv, "utf8");

  const withPhone = rows.filter((r) => r.phone).length;
  const withEmail = rows.filter((r) => r.email).length;
  console.log(`\n✓ ${rows.length} companies — ${withPhone} with phone, ${withEmail} with email.`);
  console.log(`  CSV: ${outFile}\n`);
}

main().catch((err) => {
  console.error("\n✗ " + err.message);
  process.exit(1);
});
