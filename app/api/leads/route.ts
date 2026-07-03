import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("tq_leads")
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

  if (!photo_url || !service_types || !address) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Create the customer if not exists
  let customerId = customer_id;
  if (!customerId) {
    const { data: customer, error: customerError } = await supabase
      .from("tq_customers")
      .insert({ name: "Customer", email: null, phone: null })
      .select("id")
      .single();

    if (customerError || !customer) {
      return NextResponse.json({ error: "Failed to create customer" }, { status: 500 });
    }
    customerId = customer.id;
  }

  const { data: lead, error: leadError } = await supabase
    .from("tq_leads")
    .insert({
      customer_id: customerId,
      photo_url,
      service_types,
      address,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      status: "new",
    })
    .select()
    .single();

  if (leadError) return NextResponse.json({ error: leadError.message }, { status: 500 });

  // Trigger AI analysis and contractor notifications in the background
  // (fire-and-forget — don't block the response)
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  fetch(`${baseUrl}/api/leads/${lead.id}/analyze`, { method: "POST" }).catch((e) =>
    console.error("[LeadCreated] AI analysis trigger failed:", e)
  );
  fetch(`${baseUrl}/api/notifications/send-lead-alerts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leadId: lead.id }),
  }).catch((e) =>
    console.error("[LeadCreated] Notification trigger failed:", e)
  );

  return NextResponse.json(lead, { status: 201 });
}
