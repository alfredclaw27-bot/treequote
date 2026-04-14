import type { AnalysisData, EstimatedPrice } from "@/types";
import OpenAI from "openai";

const BASE_PRICES: Record<string, { small: number; medium: number; large: number }> = {
  removal: { small: 500, medium: 1500, large: 4000 },
  trimming: { small: 150, medium: 400, large: 1000 },
  stump: { small: 100, medium: 300, large: 750 },
  palm: { small: 150, medium: 350, large: 600 },
  other: { small: 200, medium: 500, large: 1500 },
};

export function generatePriceEstimate(
  analysis: AnalysisData,
  serviceTypes: string[]
): EstimatedPrice {
  const heightStr = analysis.heightEstimate ?? "";
  let size: "small" | "medium" | "large" = "medium";
  if (heightStr.includes("<") || heightStr.includes("under") || /\d+/.test(heightStr)) {
    const ftMatch = heightStr.match(/(\d+)/);
    if (ftMatch) {
      const ft = parseInt(ftMatch[1]);
      if (ft < 20) size = "small";
      else if (ft > 45) size = "large";
    }
  }
  if (heightStr.toLowerCase().includes("50+") || heightStr.includes("50+")) size = "large";
  if (heightStr.toLowerCase().includes("stump")) size = "small";

  const priceFactors: string[] = [];
  const modifiers: Record<string, number> = {
    healthy: 1.0,
    stressed: 1.2,
    hazardous: 1.5,
    dead: 0.8,
  };

  const healthMod = modifiers[analysis.healthStatus] ?? 1.0;
  if (analysis.healthStatus === "hazardous") priceFactors.push("Hazardous — requires careful handling");
  if (analysis.healthStatus === "stressed") priceFactors.push("Stressed tree — extra care needed");

  const accessLower = (analysis.accessNotes ?? "").toLowerCase();
  if (accessLower.includes("fence")) { priceFactors.push("Fence limits access"); }
  if (accessLower.includes("house") || accessLower.includes("near structure")) { priceFactors.push("Structure nearby — careful removal needed"); }
  if (accessLower.includes("power line") || accessLower.includes("power lines")) { priceFactors.push("Near power lines — special handling required"); }
  if (accessLower.includes("clear") || accessLower.includes("easy")) { priceFactors.push("Good equipment access"); }
  if (accessLower.includes("limited")) { priceFactors.push("Limited access — more labor"); }

  if (analysis.obstacles && analysis.obstacles.length > 0) {
    analysis.obstacles.forEach((o: string) => {
      priceFactors.push(`Obstacle: ${o}`);
    });
  }

  const ranges = serviceTypes.map((svc) => {
    const base = BASE_PRICES[svc] ?? BASE_PRICES.other;
    const sizePrice = base[size];
    return {
      low: Math.round(sizePrice * healthMod * 0.85),
      high: Math.round(sizePrice * healthMod * 1.3),
    };
  });

  const low = Math.min(...ranges.map((r) => r.low));
  const high = Math.max(...ranges.map((r) => r.high));

  if (analysis.visibleDamage && analysis.visibleDamage !== "undetermined" && analysis.visibleDamage.length > 3) {
    priceFactors.push(`Visible damage: ${analysis.visibleDamage}`);
  }

  return {
    low,
    high,
    currency: "USD",
    priceFactors,
  };
}

export async function analyzeTreePhoto(imageUrl: string): Promise<{ analysis: AnalysisData; estimatedPrice: EstimatedPrice; serviceTypes: string[] }> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `You are an expert arborist analyzing a tree photo. Examine the image and return a JSON object with these exact fields (no other text):
{
  "species": "estimated tree species or type (e.g., 'Oak', 'Pine', 'Palm', 'Unknown')",
  "heightEstimate": "estimated height range (e.g., '20-30 ft', '30-50 ft', '50+ ft', 'Stump only')",
  "healthStatus": "healthy | stressed | hazardous | dead",
  "visibleDamage": "description of any visible damage, disease, dead branches, cracks, leans — or 'none' if nothing visible",
  "accessNotes": "notes on equipment access (e.g., 'fence present, limited access', 'clear access from driveway', 'near power lines')",
  "seasonIndicators": "current season indicators (e.g., 'leafless (winter)', 'full canopy (summer)', 'blooming (spring)')",
  "confidence": 0.0 to 1.0 reflecting how confident you are in your assessment",
  "obstacles": ["list of obstacles like 'fence', 'house', 'power lines', 'limited space"],
  "estimatedJobComplexity": "simple | moderate | complex | specialized"
}
Be specific and practical. If you can't determine something, say 'undetermined' rather than guessing.`,
          },
          {
            type: "image_url",
            image_url: { url: imageUrl },
          },
        ],
      },
    ],
    max_tokens: 800,
  });

  const content = response.choices[0].message.content ?? "";
  const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const analysis = JSON.parse(jsonStr) as AnalysisData;

  const serviceTypes = ["removal"];
  const estimatedPrice = generatePriceEstimate(analysis, serviceTypes);

  return { analysis, estimatedPrice, serviceTypes };
}
