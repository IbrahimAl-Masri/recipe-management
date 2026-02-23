import { streamText } from "ai";
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  const { ingredients } = await request.json();

  if (!ingredients || !Array.isArray(ingredients) || ingredients.length === 0) {
    return new Response(
      JSON.stringify({ error: "ingredients must be a non-empty array" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const ingredientList = ingredients.join(", ");

  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    messages: [
      {
        role: "system",
        content:
          "You are a creative culinary assistant. When given a list of ingredients, suggest exactly 3 recipes the user can make. For each recipe respond with: the recipe name, a brief description (1–2 sentences), the ingredients from the list that are used, and any common pantry staples also needed. Format your response as clean, readable text with clear headings for each recipe.",
      },
      {
        role: "user",
        content: `I have these ingredients: ${ingredientList}. Suggest 3 recipes I could make.`,
      },
    ],
  });

  return result.toTextStreamResponse();
}
