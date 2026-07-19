import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isAdminRequest, searchPlaces, PlacesConfigError } from "@/lib/outreach";

interface OutreachRow {
  id: string;
  lead_id: string | null;
  name: string;
  phone: string | null;
  [key: string]: unknown;
}

/**
 * POST /api/admin/outreach/find
 * Body: { query: string, leadId?: string }
 *
 * Runs a Google Places text search (up to 20 results) and upserts them into
 * tq_outreach_contractors, deduped on (coalesce(phone,''), lower(name)) — the
 * same key the DB's unique index enforces. Supabase's `.upsert()` needs an
 * onConflict column list matching a real constraint, and `lower(name)` is an
 * expression index it can't target directly, so we do the dedupe manually:
 * fetch existing rows, split into inserts vs. already-found, and (if this
 * search was for a specific lead) attach the leadId to any existing rows
 * that didn't have one yet — without touching their outreach status/notes.
 */
export async function POST(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  let body: { query?: string; leadId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const query = body.query?.trim();
  if (!query) {
    return NextResponse.json({ error: "query is required" }, { status: 400 });
  }
  const leadId = body.leadId || null;

  let results;
  try {
    results = await searchPlaces(query, 20);
  } catch (err) {
    if (err instanceof PlacesConfigError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Places search failed" },
      { status: 502 }
    );
  }

  if (!results.length) {
    return NextResponse.json({ rows: [], found: 0 });
  }

  // Everything past this point talks to Supabase. Without
  // NEXT_PUBLIC_SUPABASE_URL configured, createServiceClient() falls back to
  // a placeholder host and every call below throws — caught here so the
  // route still returns clean JSON (and the found Places results aren't
  // silently lost) instead of leaking a raw fetch error.
  try {
    const supabase = await createServiceClient();
    const candidateRows = results.map((r) => ({
      lead_id: leadId,
      source: "places",
      name: r.name,
      phone: r.phone,
      website: r.website,
      rating: r.rating,
      review_count: r.review_count,
      address: r.address,
      maps_url: r.maps_url,
    }));

    const { data: existing, error: existingError } = await supabase
      .from("tq_outreach_contractors")
      .select("id, name, phone, lead_id");

    if (existingError) {
      return NextResponse.json({ error: existingError.message }, { status: 500 });
    }

    const dedupeKey = (name: string, phone: string | null) =>
      `${(phone || "").trim()}|${name.trim().toLowerCase()}`;
    const existingMap = new Map((existing ?? []).map((e) => [dedupeKey(e.name, e.phone), e]));

    const toInsert: typeof candidateRows = [];
    const matchedIds: string[] = [];

    for (const row of candidateRows) {
      const key = dedupeKey(row.name, row.phone);
      const match = existingMap.get(key);
      if (match) {
        matchedIds.push(match.id);
        if (leadId && !match.lead_id) {
          await supabase.from("tq_outreach_contractors").update({ lead_id: leadId }).eq("id", match.id);
        }
      } else {
        toInsert.push(row);
        // Prevent duplicate inserts within the same batch (Places can return
        // the same business twice for overlapping search phrasing).
        existingMap.set(key, { id: "", name: row.name, phone: row.phone, lead_id: leadId });
      }
    }

    const savedRows: OutreachRow[] = [];

    if (matchedIds.length) {
      const { data: refetched } = await supabase
        .from("tq_outreach_contractors")
        .select("*")
        .in("id", matchedIds);
      if (refetched) savedRows.push(...(refetched as OutreachRow[]));
    }

    if (toInsert.length) {
      const { data: inserted, error: insertError } = await supabase
        .from("tq_outreach_contractors")
        .insert(toInsert)
        .select("*");
      if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
      if (inserted) savedRows.push(...(inserted as OutreachRow[]));
    }

    savedRows.sort((a, b) => (a.name > b.name ? 1 : -1));

    return NextResponse.json({ rows: savedRows, found: results.length });
  } catch {
    return NextResponse.json(
      { error: "Database not configured — set up Supabase to save outreach results" },
      { status: 500 }
    );
  }
}
