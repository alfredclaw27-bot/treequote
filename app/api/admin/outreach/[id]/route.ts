import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { isAdminRequest, OUTREACH_STATUSES } from "@/lib/outreach";

/**
 * PATCH /api/admin/outreach/[id]
 * Body: { status?: OutreachStatus, notes?: string }
 * Updates an outreach row. Setting `status` to "contacted" (and it wasn't
 * already) stamps `contacted_at` with the current time.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!isAdminRequest(req)) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const { id } = await params;

  let body: { status?: string; notes?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };

  if (body.status !== undefined) {
    if (!OUTREACH_STATUSES.includes(body.status as (typeof OUTREACH_STATUSES)[number])) {
      return NextResponse.json({ error: `Invalid status: ${body.status}` }, { status: 400 });
    }
    update.status = body.status;
  }

  if (body.notes !== undefined) {
    update.notes = body.notes;
  }

  if (Object.keys(update).length === 1) {
    return NextResponse.json({ error: "Nothing to update — provide status and/or notes" }, { status: 400 });
  }

  try {
    const supabase = await createServiceClient();

    // Stamp contacted_at the first time status moves to "contacted".
    if (update.status === "contacted") {
      const { data: current } = await supabase
        .from("tq_outreach_contractors")
        .select("contacted_at")
        .eq("id", id)
        .single();
      if (current && !current.contacted_at) {
        update.contacted_at = new Date().toISOString();
      }
    }

    const { data, error } = await supabase
      .from("tq_outreach_contractors")
      .update(update)
      .eq("id", id)
      .select("*")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Database not configured" }, { status: 500 });
  }
}
