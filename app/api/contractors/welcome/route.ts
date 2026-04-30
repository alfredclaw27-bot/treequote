import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { sendContractorApplicationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email, businessName } = await req.json();

    if (!email || !businessName) {
      return NextResponse.json({ error: "email and businessName are required" }, { status: 400 });
    }

    await sendContractorApplicationEmail({ to: email, businessName });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to send contractor welcome email:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}