import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: leadId } = await params;
  const supabase = await createServiceClient();
  const body = await req.json();

  const { contractor_id, amount, notes, estimated_date } = body;

  if (!contractor_id || !amount) {
    return NextResponse.json({ error: "Contractor ID and amount are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("quotes")
    .insert({
      lead_id: leadId,
      contractor_id,
      amount,
      notes: notes || null,
      estimated_date: estimated_date || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Update lead status to quoted
  await supabase.from("leads").update({ status: "quoted" }).eq("id", leadId);

  return NextResponse.json(data, { status: 201 });
}
