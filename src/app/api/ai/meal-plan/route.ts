import { streamText } from "ai";
import { createGroq } from "@ai-sdk/groq";

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(request: Request) {
  const { preferences, days } = await request.json();

  if (!days || typeof days !== "number" || days < 1 || days > 14) {
    return new Response(
      JSON.stringify({ error: "days must be a number between 1 and 14" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const preferencesText =
    preferences && typeof preferences === "string" && preferences.trim()
      ? preferences.trim()
      : "no specific dietary restrictions";

  const result = streamText({
    model: groq("llama-3.3-70b-versatile"),
    messages: [
      {
        role: "system",
        content:
          "You are a professional meal planner and nutritionist. When given dietary preferences and a number of days, generate a structured meal plan. For each day include breakfast, lunch, dinner, and one snack. Each meal should have a name and a one-sentence description. Ensure variety across the days and respect all dietary requirements. Format the plan clearly with each day as a heading and the four meals listed beneath it.",
      },
      {
        role: "user",
        content: `Create a ${days}-day meal plan for someone with the following dietary preferences: ${preferencesText}. Include breakfast, lunch, dinner, and a snack for each day.`,
      },
    ],
  });

  return result.toDataStreamResponse();
}
