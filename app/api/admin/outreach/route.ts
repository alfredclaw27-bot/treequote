import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isAdminRequest } from "@/lib/outreach";

/**
 * GET /api/admin/outreach?leadId=xxx
 * Lists rows from tq_outreach_contractors, optionally scoped to one lead.
 * Admin-only — see isAdminRequest (mirrors the /admin cookie gate in
 * proxy.ts, which does not cover /api/admin/**).
 */
export async function GET(req: NextRequest) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const leadId = searchParams.get("leadId");

  try {
    const supabase = await createServiceClient();
    let query = supabase
      .from("tq_outreach_contractors")
      .select("*")
      .order("created_at", { ascending: false });

    if (leadId) query = query.eq("lead_id", leadId);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
  } catch {
    // No Supabase configured (demo mode) — the admin UI treats a non-ok
    // response as "nothing found yet" rather than crashing.
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }
}
