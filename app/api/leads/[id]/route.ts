import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { buildLeadEditChanges } from "@/lib/lead-events";
import type { LeadDetails } from "@/types";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServiceClient();

  const { data, error } = await supabase
    .from("tq_leads")
    .select("*, customer:tq_customers(*)")
    .eq("id", id)
    .single();

  if (error || !data) return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  return NextResponse.json(data);
}

/**
 * PATCH /api/leads/[id]
 *
 * Lets a customer edit their submitted job details after the fact.
 * Intentionally scoped to `details` + `service_types` only — contact info
 * (name/phone/email) and the address are never editable here, so nothing
 * masked pre-unlock on the contractor side can be changed through this
 * route. Every accepted edit is recorded as a `tq_lead_events` row with a
 * human-readable field-by-field diff (see lib/lead-events.ts) so the change
 * is visible with a date/time on both the customer and contractor timelines.
 *
 * Auth note: like the rest of the customer-facing lead routes in this app
 * (e.g. the confirmation-link quotes page, GET above, and the quote-accept
 * route), the lead's UUID itself is the bearer credential — there is no
 * separate session/email check today because there is no ownership check
 * anywhere else in this flow either. See the lead-events board entry for
 * the same limitation noted explicitly.
 */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  let body: { details?: LeadDetails; service_types?: string[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const supabase = await createServiceClient();

  const { data: current, error: fetchError } = await supabase
    .from("tq_leads")
    .select("id, details, service_types")
    .eq("id", id)
    .single();

  if (fetchError || !current) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  const nextDetails: LeadDetails = body.details ?? (current.details as LeadDetails) ?? {};
  const nextServiceTypes: string[] = body.service_types ?? (current.service_types as string[]) ?? [];

  const changes = buildLeadEditChanges(
    { details: (current.details as LeadDetails) ?? {}, service_types: (current.service_types as string[]) ?? [] },
    { details: nextDetails, service_types: nextServiceTypes }
  );

  if (changes.length === 0) {
    // Nothing actually changed — no-op, no event row.
    const { data: unchanged } = await supabase
      .from("tq_leads")
      .select("*, customer:tq_customers(*)")
      .eq("id", id)
      .single();
    return NextResponse.json({ lead: unchanged, event: null });
  }

  const { data: updated, error: updateError } = await supabase
    .from("tq_leads")
    .update({ details: nextDetails, service_types: nextServiceTypes })
    .eq("id", id)
    .select("*, customer:tq_customers(*)")
    .single();

  if (updateError || !updated) {
    return NextResponse.json({ error: updateError?.message || "Failed to update lead" }, { status: 500 });
  }

  const { data: event, error: eventError } = await supabase
    .from("tq_lead_events")
    .insert({ lead_id: id, actor: "customer", type: "edit", changes })
    .select("*")
    .single();

  if (eventError) {
    console.error("[leads] Failed to record edit event:", eventError.message);
  }

  return NextResponse.json({ lead: updated, event: event ?? null });
}
