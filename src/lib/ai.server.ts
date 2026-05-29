// Server-only Lovable AI Gateway helpers. Never import from client code.
const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";
const MODEL = "google/gemini-2.5-flash";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content:
    | string
    | Array<
        | { type: "text"; text: string }
        | { type: "image_url"; image_url: { url: string } }
      >;
};

async function callGemini(messages: ChatMessage[], jsonMode = false): Promise<string> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) {
    console.warn("LOVABLE_API_KEY missing — AI call skipped");
    return "";
  }
  const res = await fetch(GATEWAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      ...(jsonMode ? { response_format: { type: "json_object" } } : {}),
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    console.error("AI gateway error", res.status, txt);
    return "";
  }
  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  return data.choices?.[0]?.message?.content ?? "";
}

function extractJson(raw: string): unknown {
  if (!raw) return null;
  const cleaned = raw
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/, "")
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        return JSON.parse(m[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

export async function analyseImage(imageUrl: string): Promise<{
  category: string;
  tags: string[];
  shortDescription: string;
}> {
  try {
    const raw = await callGemini(
      [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: 'Analyse this product image. Return ONLY a valid JSON object with these exact keys: { "category": string, "tags": string[] (max 8 items), "shortDescription": string (max 20 words) }. No extra text, no markdown.',
            },
            { type: "image_url", image_url: { url: imageUrl } },
          ],
        },
      ],
      true,
    );
    const parsed = extractJson(raw) as {
      category?: string;
      tags?: string[];
      shortDescription?: string;
    } | null;
    return {
      category: parsed?.category ?? "",
      tags: Array.isArray(parsed?.tags) ? parsed!.tags!.slice(0, 8) : [],
      shortDescription: parsed?.shortDescription ?? "",
    };
  } catch (e) {
    console.warn("analyseImage failed", e);
    return { category: "", tags: [], shortDescription: "" };
  }
}

export async function generateDescription(p: {
  name: string;
  type?: string;
  color?: string;
  ram?: string;
  storage?: string;
  price?: number | string;
}): Promise<string> {
  try {
    const prompt = `Write a professional product description for a premium electronics store. Product: name="${p.name}", type="${p.type ?? ""}", color="${p.color ?? ""}", ram="${p.ram ?? ""}", storage="${p.storage ?? ""}", price="${p.price ?? ""}". Under 120 words. Confident, premium tone. Plain paragraph, no bullet points.`;
    const raw = await callGemini([{ role: "user", content: prompt }]);
    return raw.trim();
  } catch (e) {
    console.warn("generateDescription failed", e);
    return "";
  }
}

export async function generateMetadata(
  p: { name: string; type?: string; color?: string; price?: number | string },
  tags: string[],
): Promise<{ socialCaption: string; seoKeywords: string[] }> {
  try {
    const prompt = `Generate marketing metadata for product "${p.name}" (${p.type ?? ""}, ${p.color ?? ""}, ₦${p.price ?? ""}), tags: ${tags.join(", ")}. Return ONLY valid JSON: { "socialCaption": string (Instagram-style, under 60 words, 3-5 hashtags), "seoKeywords": string[] (exactly 5 items) }. No extra text.`;
    const raw = await callGemini([{ role: "user", content: prompt }], true);
    const parsed = extractJson(raw) as {
      socialCaption?: string;
      seoKeywords?: string[];
    } | null;
    return {
      socialCaption: parsed?.socialCaption ?? "",
      seoKeywords: Array.isArray(parsed?.seoKeywords)
        ? parsed!.seoKeywords!.slice(0, 5)
        : [],
    };
  } catch (e) {
    console.warn("generateMetadata failed", e);
    return { socialCaption: "", seoKeywords: [] };
  }
}
