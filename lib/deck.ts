import { Card, Category } from "./types";

/**
 * Pure deterministic shuffle with a seeded PRNG so test runs are stable.
 */
export function seededShuffle<T>(arr: T[], seed: number): T[] {
  const out = arr.slice();
  let s = seed >>> 0 || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/**
 * Merge seed + generated, dedupe by id (seed wins), filter out already-seen.
 */
export function buildDeck(opts: {
  seed: Card[];
  generated: Card[];
  seenIds: Set<string>;
  shuffleSeed?: number;
}): Card[] {
  const byId = new Map<string, Card>();
  for (const c of opts.seed) byId.set(c.id, c);
  for (const c of opts.generated) if (!byId.has(c.id)) byId.set(c.id, c);
  const all = [...byId.values()].filter((c) => !opts.seenIds.has(c.id));
  return seededShuffle(all, opts.shuffleSeed ?? Date.now() & 0xffffffff);
}

/**
 * Reorder a deck so no two consecutive cards share a category where avoidable.
 * Greedy: take next card whose category differs from the previous; if none, accept duplicate.
 */
export function avoidBackToBackCategory(cards: Card[]): Card[] {
  if (cards.length <= 1) return cards.slice();
  const remaining = cards.slice();
  const out: Card[] = [];
  let lastCat: Category | null = null;
  while (remaining.length > 0) {
    let idx = remaining.findIndex((c) => c.category !== lastCat);
    if (idx === -1) idx = 0;
    const [taken] = remaining.splice(idx, 1);
    out.push(taken);
    lastCat = taken.category;
  }
  return out;
}

export function countUnseen(deck: Card[], seenIds: Set<string>): number {
  let n = 0;
  for (const c of deck) if (!seenIds.has(c.id)) n++;
  return n;
}
