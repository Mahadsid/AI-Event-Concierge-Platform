export const generateEventProposal = async (prompt: string) => {
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content: `
You are an AI Event Concierge.

Return ONLY valid JSON (no markdown, no text outside JSON).

Format:
{
  "venueName": string,
  "location": string,
  "estimatedCost": string,
  "whyItFits": string
}
          `,
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  const data = await res.json();

  const text = data.choices?.[0]?.message?.content;

  try {
    return JSON.parse(text);
  } catch (err) {
    throw new Error("AI response parsing failed");
  }
};