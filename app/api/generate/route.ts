import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { CategoryEnum, type Category } from "@/lib/types";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `You write short, fascinating learning cards for an app called Mindful, designed to replace doom-scrolling with curiosity. Each card teaches one specific, well-established idea or fact.

CATEGORIES & STYLE:
- science: clearly explained mechanisms, mental-model focused
- history: durable, well-known events; AVOID specific dates or attributions unless extremely well-known and easy to verify on Wikipedia
- fact: short, surprising, single-sentence-able; one paragraph max
- nature: animals, ecosystems, plants, geology
- art: paintings, architecture, music, cultural artifacts
- food: history of dishes, cultural origins, science of ingredients

CONSTRAINTS:
- Tone: warm, curious, like a brilliant friend at dinner. Never moralizing. Never sad.
- ALLOWED themes: curiosity, wonder, cognition, beauty, ingenuity, connection.
- DENIED themes: politics, current events, war as ongoing news, religion-as-truth-claim, self-harm, tragedy verbs, slurs, depressing existential framing.
- Be specific: numbers, mechanisms, names of things. Avoid vague "many scientists believe".
- DO NOT invent specific historical dates, exact quotes, or attributions to specific named people unless you are highly confident.
- All claims must be verifiable on Wikipedia.
- Markdown allowed in body: **bold**, *italic*, paragraphs, links. NO HTML, NO IMAGES IN MARKDOWN.

OUTPUT FORMAT:
Return JSON only — no prose, no code fences. Shape:
{
  "cards": [
    {
      "id": "kebab-case-slug-unique",
      "category": "<one of: science|history|fact|nature|art|food>",
      "title": "Short headline (under 80 chars)",
      "subtitle": "Optional one-line subtitle, or omit",
      "image": { "kind": "gradient", "seed": "<same as id>", "emoji": "<single emoji>" },
      "body": "Markdown body, 2–4 short paragraphs unless lengthHint=short.",
      "takeaway": "Optional one-line mental model, or omit",
      "lengthHint": "short" | "medium" | "long",
      "origin": "generated"
    }
  ]
}

Generate {{COUNT}} cards in category "{{CATEGORY}}". Each card MUST have a unique id not in this excluded list: {{EXCLUDED_IDS}}.`;

function buildPrompt(category: Category, count: number, excluded: string[]) {
  return SYSTEM_PROMPT
    .replace("{{COUNT}}", String(count))
    .replace("{{CATEGORY}}", category)
    .replace("{{EXCLUDED_IDS}}", excluded.slice(0, 100).join(", "));
}

function extractJSON(text: string): unknown {
  // Try direct JSON first.
  try {
    return JSON.parse(text);
  } catch {
    /* fall through */
  }
  // Strip code fences if present.
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    try {
      return JSON.parse(fence[1]);
    } catch {
      /* fall through */
    }
  }
  // Best-effort: find first { and last }.
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first >= 0 && last > first) {
    try {
      return JSON.parse(text.slice(first, last + 1));
    } catch {
      /* ignore */
    }
  }
  throw new Error("Could not extract JSON from model output");
}

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-anthropic-key");
  if (!apiKey) {
    return NextResponse.json({ error: "missing api key" }, { status: 401 });
  }

  let body: { category: unknown; count: unknown; existingIds: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const catParse = CategoryEnum.safeParse(body.category);
  if (!catParse.success) {
    return NextResponse.json({ error: "invalid category" }, { status: 400 });
  }
  const category = catParse.data;
  if (category === "big_question") {
    return NextResponse.json(
      { error: "big_question category is not eligible for top-up" },
      { status: 400 },
    );
  }
  const count = Math.min(Math.max(Number(body.count) || 5, 1), 5);
  const excluded = Array.isArray(body.existingIds)
    ? (body.existingIds as unknown[]).filter((x): x is string => typeof x === "string")
    : [];

  const client = new Anthropic({ apiKey });
  const prompt = buildPrompt(category, count, excluded);

  let raw = "";
  try {
    const resp = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system: prompt,
      messages: [
        {
          role: "user",
          content: `Generate ${count} ${category} cards now as JSON.`,
        },
      ],
    });
    for (const block of resp.content) {
      if (block.type === "text") raw += block.text;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `model call failed: ${msg}` }, { status: 502 });
  }

  let parsed: { cards?: unknown[] };
  try {
    parsed = extractJSON(raw) as { cards?: unknown[] };
  } catch {
    // Retry once, asking the model to fix its output.
    try {
      const fix = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4000,
        system: prompt,
        messages: [
          { role: "user", content: `Generate ${count} ${category} cards now as JSON.` },
          { role: "assistant", content: raw },
          {
            role: "user",
            content: "That was not valid JSON. Reply ONLY with the JSON object, nothing else.",
          },
        ],
      });
      let fixed = "";
      for (const block of fix.content) if (block.type === "text") fixed += block.text;
      parsed = extractJSON(fixed) as { cards?: unknown[] };
    } catch {
      return NextResponse.json({ cards: [] });
    }
  }

  const cards = Array.isArray(parsed.cards) ? parsed.cards : [];
  return NextResponse.json({ cards });
}
