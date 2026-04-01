import OpenAI from "openai";
import type { AnalysisData } from "@/types";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function analyzeTreePhoto(imageUrl: string): Promise<AnalysisData> {
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
  "heightEstimate": "estimated height range (e.g., '20-30 ft', '30-50 ft', '50+ ft')",
  "healthStatus": "healthy | stressed | hazardous | dead",
  "visibleDamage": "description of any visible damage, disease, dead branches, cracks, leans",
  "accessNotes": "notes on equipment access (e.g., 'fence present, limited access', 'clear access from driveway', 'near power lines')",
  "seasonIndicators": "current season indicators visible in photo (e.g., 'leafless (winter)', 'full canopy (summer)', 'blooming (spring)')",
  "confidence": 0.0 to 1.0 reflecting how confident you are in your assessment
}
Be specific and practical. If you can't determine something, say "undetermined" rather than guessing.`,
          },
          {
            type: "image_url",
            image_url: { url: imageUrl },
          },
        ],
      },
    ],
    max_tokens: 500,
  });

  const content = response.choices[0].message.content ?? "";
  // Strip markdown code blocks if present
  const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  return JSON.parse(jsonStr) as AnalysisData;
}
