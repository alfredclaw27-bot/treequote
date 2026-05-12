import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

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
