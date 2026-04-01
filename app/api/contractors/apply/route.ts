import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createServiceClient();
  const body = await req.json();

  const { email, business_name, phone, service_area, specialties } = body;

  if (!email || !business_name) {
    return NextResponse.json({ error: "Email and business name are required" }, { status: 400 });
  }

  // Check if email already exists
  const { data: existing } = await supabase
    .from("contractors")
    .select("id")
    .eq("email", email)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  // Note: Auth user creation is handled client-side via Supabase Auth
  // This endpoint is for admin/backup record creation
  return NextResponse.json({ success: true, message: "Application received" });
}
