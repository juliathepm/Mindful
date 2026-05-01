import { describe, it, expect } from "vitest";
import { avoidBackToBackCategory, buildDeck } from "../deck";
import type { Card } from "../types";

function mk(id: string, category: Card["category"] = "fact"): Card {
  return {
    id,
    category: category as Exclude<Card["category"], "big_question">,
    title: id,
    image: { kind: "gradient", seed: id },
    body: "x",
    lengthHint: "short",
    origin: "seed",
  } as Card;
}

describe("buildDeck", () => {
  it("dedupes by id, prefers seed over generated, filters seen", () => {
    const seed = [mk("a"), mk("b"), mk("c")];
    const generated = [mk("b"), mk("d")]; // 'b' duplicate
    const seen = new Set(["a"]);
    const deck = buildDeck({ seed, generated, seenIds: seen, shuffleSeed: 1 });
    const ids = deck.map((c) => c.id).sort();
    expect(ids).toEqual(["b", "c", "d"]);
  });
});

describe("avoidBackToBackCategory", () => {
  it("avoids two adjacent same-category cards when possible", () => {
    const cards = [
      mk("f1", "fact"),
      mk("f2", "fact"),
      mk("s1", "science"),
      mk("n1", "nature"),
    ];
    const out = avoidBackToBackCategory(cards);
    for (let i = 1; i < out.length; i++) {
      expect(out[i].category).not.toBe(out[i - 1].category);
    }
  });

  it("falls back gracefully when only one category remains", () => {
    const cards = [mk("f1", "fact"), mk("f2", "fact"), mk("f3", "fact")];
    const out = avoidBackToBackCategory(cards);
    expect(out).toHaveLength(3);
  });
});
