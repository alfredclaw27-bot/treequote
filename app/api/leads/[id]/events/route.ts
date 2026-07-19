import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/leads/[id]/events
 * Lists the "Updates & comments" timeline for a lead (comments + tracked
 * edits), oldest first — see tq_lead_events / lib/lead-events.ts.
 */
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("tq_lead_events")
    .select("*")
    .eq("lead_id", id)
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ events: data ?? [] });
}

/**
 * POST /api/leads/[id]/events
 * Adds a comment to a lead's timeline. Body: { body: string }.
 * Actor is always "customer" here — the only writer of comments today is
 * the customer quotes page (app/customer/quotes/[leadId]/page.tsx); the
 * contractor quote page only reads this timeline (see that page's header
 * comment for the masking rationale).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let payload: { body?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const commentBody = (payload.body ?? "").trim();
  if (!commentBody) {
    return NextResponse.json({ error: "Comment cannot be empty" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  const { data: lead, error: leadError } = await supabase
    .from("tq_leads")
    .select("id")
    .eq("id", id)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const { data: event, error } = await supabase
    .from("tq_lead_events")
    .insert({ lead_id: id, actor: "customer", type: "comment", body: commentBody })
    .select("*")
    .single();

  if (error || !event) {
    return NextResponse.json({ error: error?.message || "Failed to save comment" }, { status: 500 });
  }

  return NextResponse.json({ event });
}
