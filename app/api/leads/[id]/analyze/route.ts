import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { analyzeTreePhoto } from "@/lib/ai-analysis";
import { generatePriceEstimate } from "@/lib/ai-analysis";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createServiceClient();

  // Get the lead with service types
  const { data: lead, error: leadError } = await supabase
    .from("tq_leads")
    .select("photo_url, service_types")
    .eq("id", id)
    .single();

  if (leadError || !lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  // Check if OpenAI API key is configured
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "placeholder_openai_api_key" || process.env.OPENAI_API_KEY === "your_openai_api_key") {
    const stubAnalysis = {
      species: "Analysis pending — configure OPENAI_API_KEY in .env.local",
      heightEstimate: "undetermined",
      healthStatus: "undetermined",
      visibleDamage: "undetermined",
      accessNotes: "undetermined",
      seasonIndicators: "undetermined",
      confidence: 0,
      obstacles: [] as string[],
      estimatedJobComplexity: "undetermined" as const,
    };
    const stubPrice = { low: 0, high: 0, currency: "USD" as const, priceFactors: ["Configure OPENAI_API_KEY to enable analysis"] };
    await supabase.from("tq_leads").update({ analysis_data: stubAnalysis, estimated_price: stubPrice }).eq("id", id);
    return NextResponse.json({ analysis: stubAnalysis, estimatedPrice: stubPrice, stub: true });
  }

  try {
    const { analysis, estimatedPrice } = await analyzeTreePhoto(lead.photo_url);

    // Use actual service types from the lead for price estimation
    const accuratePrice = generatePriceEstimate(analysis, lead.service_types);

    await supabase.from("tq_leads").update({
      analysis_data: analysis,
      estimated_price: accuratePrice,
    }).eq("id", id);

    return NextResponse.json({ analysis, estimatedPrice: accuratePrice });
  } catch (err) {
    console.error("AI analysis error:", err);
    return NextResponse.json({ error: "Analysis failed — check OpenAI API key and try again" }, { status: 500 });
  }
}