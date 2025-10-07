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
    const { messages = [], mode = "career" } = req.body || {};
    const sys = MODE_PROMPTS[mode] || MODE_PROMPTS.career;

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: sys },
        ...messages.map(m => ({ role: (m.role || "user"), content: m.content }))
      ]
    });

    const text = completion.choices?.[0]?.message?.content || "";
    return res.status(200).json({ reply: text });
  } catch (e) {
    return res.status(500).json({ error: String(e.message || e) });
  }
}
