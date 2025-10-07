export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

import OpenAI from "openai";
const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODE_PROMPTS = {
  fitness: "You are a pragmatic fitness coach. Keep plans realistic, safe, and progressive.",
  study:   "You are a focused study coach. Teach study tactics and break work into chunks.",
  career:  "You are a candid career coach. Offer practical steps and clear options."
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")   return res.status(405).json({ error: "POST only" });

  try {
    const { goals = ["Make progress this week"], mode = "career" } = req.body || {};
    const sys = MODE_PROMPTS[mode] || MODE_PROMPTS.career;

    const prompt = `
SYSTEM: ${sys}
USER: Based on these goals: ${goals.map(g => `• ${g}`).join("\n")}
Create a 1-week plan as JSON with fields:
- weekSummary (string)
- tasks (array of { title, details, day, estimatedMins })
Return ONLY valid JSON.
`;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        { role: "user", content: prompt }
      ]
    });

    let text = completion.choices?.[0]?.message?.content?.trim() || "";
    const m = text.match(/```json([\s\S]*?)```/i);
    if (m) text = m[1].trim();
    const json = JSON.parse(text);

    return res.status(200).json(json);
  } catch (e) {
    return res.status(500).json({ error: "Plan generation failed", detail: String(e.message || e) });
  }
}
