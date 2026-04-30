import { NextRequest, NextResponse } from "next/server";
import { sendCustomerLeadConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { email, customerName, leadId, serviceTypes, address } = await req.json();

    if (!email || !leadId) {
      return NextResponse.json({ error: "email and leadId are required" }, { status: 400 });
    }

    await sendCustomerLeadConfirmationEmail({
      to: email,
      customerName: customerName || "there",
      leadId,
      serviceTypes: serviceTypes || [],
      address: address || "",
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Failed to send customer confirmation email:", err);
    return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
  }
}