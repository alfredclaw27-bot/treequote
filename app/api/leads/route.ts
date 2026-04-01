import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("leads")
    .select("*, customer:customers(*)")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient();
  const body = await req.json();

  const { customer_id, photo_url, service_types, address, latitude, longitude } = body;

  if (!photo_url || !service_types || !address || !customer_id) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({
      customer_id,
      photo_url,
      service_types,
      address,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      status: "new",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
