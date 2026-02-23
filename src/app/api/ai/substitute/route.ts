import { streamText } from "ai";
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  const { ingredient } = await request.json();

  if (!ingredient || typeof ingredient !== "string" || !ingredient.trim()) {
    return new Response(
      JSON.stringify({ error: "ingredient must be a non-empty string" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    messages: [
      {
        role: "system",
        content:
          "You are a knowledgeable culinary assistant specialising in ingredient substitutions. When given an ingredient, provide exactly 3 substitutes. For each substitute include: the substitute name, the ratio or amount to use in place of the original, and a brief note on how it changes the flavour, texture, or outcome of the dish. Format your response as clean, readable text with clear headings for each substitute.",
      },
      {
        role: "user",
        content: `What are 3 good substitutes for ${ingredient.trim()}? Include notes on how each substitute affects the dish.`,
      },
    ],
  });

  return result.toDataStreamResponse();
}
