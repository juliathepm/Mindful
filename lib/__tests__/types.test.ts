import { describe, it, expect } from "vitest";
import { CardSchema } from "../types";

describe("CardSchema", () => {
  it("rejects malformed LLM output", () => {
    const bad = {
      id: "no-spaces allowed",
      category: "science",
      title: "X",
      image: { kind: "gradient", seed: "x" },
      body: "x",
      lengthHint: "short",
      origin: "generated",
    };
    expect(CardSchema.safeParse(bad).success).toBe(false);
  });

  it("rejects big_question without framings", () => {
    const bad = {
      id: "q-1",
      category: "big_question",
      title: "X",
      image: { kind: "gradient", seed: "x" },
      body: "x",
      lengthHint: "short",
      origin: "seed",
    };
    expect(CardSchema.safeParse(bad).success).toBe(false);
  });

  it("accepts a valid science card", () => {
    const ok = {
      id: "valid-card",
      category: "science",
      title: "T",
      image: { kind: "gradient", seed: "x", emoji: "🌟" },
      body: "x",
      lengthHint: "short",
      origin: "seed",
    };
    expect(CardSchema.safeParse(ok).success).toBe(true);
  });

  it("accepts a valid big_question with framings", () => {
    const ok = {
      id: "valid-q",
      category: "big_question",
      title: "T",
      image: { kind: "gradient", seed: "x" },
      body: "x",
      framings: ["a", "b"],
      lengthHint: "medium",
      origin: "seed",
    };
    expect(CardSchema.safeParse(ok).success).toBe(true);
  });
});
