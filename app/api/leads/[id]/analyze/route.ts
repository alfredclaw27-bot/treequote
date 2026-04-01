import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { analyzeTreePhoto } from "@/lib/openai";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServiceClient();

  // Get the lead
  const { data: lead, error: leadError } = await supabase
    .from("leads")
    .select("photo_url")
    .eq("id", id)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your_openai_api_key") {
    // Stub response if no API key
    const stubAnalysis = {
      species: "Analysis pending — configure OPENAI_API_KEY",
      heightEstimate: "undetermined",
      healthStatus: "undetermined",
      visibleDamage: "undetermined",
      accessNotes: "undetermined",
      seasonIndicators: "undetermined",
      confidence: 0,
    };
    await supabase.from("leads").update({ analysis_data: stubAnalysis }).eq("id", id);
    return NextResponse.json({ analysis: stubAnalysis, stub: true });
  }

  try {
    const analysis = await analyzeTreePhoto(lead.photo_url);
    await supabase.from("leads").update({ analysis_data: analysis }).eq("id", id);
    return NextResponse.json({ analysis });
  } catch (err) {
    console.error("AI analysis error:", err);
    return NextResponse.json({ error: "Analysis failed" }, { status: 500 });
  }
}
