import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createServiceClient();
  const { searchParams } = new URL(req.url);
  const contractorId = searchParams.get("contractor_id");

  let query = supabase
    .from("tq_quotes")
    .select("*, lead:tq_leads(*), contractor:tq_contractors(*)")
    .order("created_at", { ascending: false });

  if (contractorId) {
    query = query.eq("contractor_id", contractorId);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient();
  const body = await req.json();

  const { lead_id, contractor_id, amount, notes, estimated_date } = body;

  if (!lead_id || !contractor_id || !amount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("tq_quotes")
    .insert({
      lead_id,
      contractor_id,
      amount,
      notes: notes || null,
      estimated_date: estimated_date || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update lead status
  await supabase.from("tq_leads").update({ status: "quoted" }).eq("id", lead_id);

  return NextResponse.json(data, { status: 201 });
}
