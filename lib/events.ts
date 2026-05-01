import { Card, CardEvent } from "./types";
import { appendEvent, readEvents } from "./storage";

export function logEvent(
  card: Card,
  action: CardEvent["action"],
  ts: number = Date.now(),
): void {
  appendEvent({
    ts,
    cardId: card.id,
    category: card.category,
    action,
    source: card.origin,
  });
}

export function deriveHeartedIds(events: CardEvent[] = readEvents()): Set<string> {
  const state = new Map<string, boolean>();
  for (const e of events) {
    if (e.action === "hearted") state.set(e.cardId, true);
    else if (e.action === "unhearted") state.set(e.cardId, false);
  }
  return new Set(
    [...state.entries()].filter(([, v]) => v).map(([k]) => k),
  );
}

export function deriveSeenIds(events: CardEvent[] = readEvents()): Set<string> {
  const ids = new Set<string>();
  for (const e of events) if (e.action === "seen") ids.add(e.cardId);
  return ids;
}

export function isHearted(cardId: string, hearted: Set<string>): boolean {
  return hearted.has(cardId);
}
