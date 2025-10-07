import OpenAI from "openai";

// Allow bigger JSON bodies if needed
export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

const MODE_PROMPTS = {
  fitness: "You are a pragmatic fitness coach. Keep plans realistic, safe, and progressive.",
  study:   "You are a focused study coach. Teach study tactics and break work into chunks.",
  career:  "You are a candid career coach. Offer practical steps and clear options."
};

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST")   return res.status(405).json({ error: "POST only" });

  try {
    const { messages = [], mode = "career" } = req.body || {};
    const sys = MODE_PROMPTS[mode] || MODE_PROMPTS.career;

    // OpenAI Responses API
    // https://platform.openai.com/docs/api-reference/responses
    const prompt = [
      `SYSTEM: ${sys}`,
      ...messages.map(m => `${String(m.role || "user").toUpperCase()}: ${m.content}`)
    ].join("\n");

    const response = await client.responses.create({
      model: "gpt-4o-mini",
      input: prompt
    });

    // SDK exposes a convenience accessor for text output
    const text = response.output_text || response.content?.[0]?.text || "";
    return res.status(200).json({ reply: text });
  } catch (e) {
    return res.status(400).json({ error: String(e.message || e) });
  }
}
