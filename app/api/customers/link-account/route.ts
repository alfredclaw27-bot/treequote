import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/customers/link-account
 * Links every `tq_customers` row matching an email to a freshly created
 * Supabase Auth user (called right after `supabase.auth.signUp` succeeds on
 * /customer/setup). Uses the service client since this needs to write
 * across rows the anon key wouldn't otherwise be scoped to.
 */
export async function POST(req: NextRequest) {
  const { authUserId, email } = await req.json();

  if (!authUserId || !email) {
    return NextResponse.json({ error: "authUserId and email are required" }, { status: 400 });
  }

  const supabase = await createServiceClient();
  const { data, error } = await supabase
    .from("tq_customers")
    .update({ auth_user_id: authUserId })
    .eq("email", email)
    .select("id");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ linked: data?.length ?? 0 });
}
