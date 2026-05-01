import { Card, CardSchema, Category } from "./types";

type GenerateInput = {
  apiKey: string;
  category: Category;
  count: number;
  existingIds: Set<string>;
};

const DENYLIST = [
  // crude keyword guard for generated content. Drop card on hit.
  "suicide", "self-harm", "kill yourself", "rape", "molest",
  "n-word", "f-slur", "kike", "spic", "chink",
  "trump", "biden", "putin", "netanyahu", "zelenskyy", "xi jinping",
  "abortion", "election", "vaccine mandate",
];

export function flagsContent(text: string): boolean {
  const lower = text.toLowerCase();
  return DENYLIST.some((w) => lower.includes(w));
}

export async function generateCards(input: GenerateInput): Promise<Card[]> {
  const res = await fetch("/api/generate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-anthropic-key": input.apiKey,
    },
    body: JSON.stringify({
      category: input.category,
      count: input.count,
      existingIds: [...input.existingIds],
    }),
  });
  if (!res.ok) {
    throw new Error(`generate failed: ${res.status}`);
  }
  const json = (await res.json()) as { cards: unknown[] };
  const out: Card[] = [];
  for (const raw of json.cards ?? []) {
    const parsed = CardSchema.safeParse(raw);
    if (!parsed.success) continue;
    if (input.existingIds.has(parsed.data.id)) continue;
    if (flagsContent(parsed.data.title) || flagsContent(parsed.data.body)) continue;
    out.push(parsed.data);
  }
  return out;
}
