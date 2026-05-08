"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Deck } from "@/components/Deck";
import { SavedSheet } from "@/components/SavedSheet";
import { SEED_CARDS } from "@/data/seed";
import {
  appendGenerated,
  readGenerated,
  readSettings,
  writeSettings,
} from "@/lib/storage";
import {
  buildDeck,
  avoidBackToBackCategory,
  countUnseen,
} from "@/lib/deck";
import {
  deriveHeartedIds,
  deriveSeenIds,
  logEvent,
} from "@/lib/events";
import type { Card } from "@/lib/types";
import {
  TOPUP_DAILY_LIMIT,
  TOPUP_UNSEEN_THRESHOLD,
  TOP_UP_CATEGORIES,
} from "@/lib/types";
import { generateCards } from "@/lib/anthropic";

function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}

export default function HomePage() {
  const router = useRouter();
  const [hydrated, setHydrated] = useState(false);
  const [hearted, setHearted] = useState<Set<string>>(new Set());
  const [seen, setSeen] = useState<Set<string>>(new Set());
  // Snapshot of seen IDs at session start. The deck filters against this
  // frozen set, not the live `seen`, so marking a card seen during the
  // session doesn't immediately rebuild the deck and shift the current card.
  const [initialSeen, setInitialSeen] = useState<Set<string>>(new Set());
  const [generated, setGenerated] = useState<Card[]>([]);
  const [savedOpen, setSavedOpen] = useState(false);
  const [topupInflight, setTopupInflight] = useState(false);

  useEffect(() => {
    const seenIds = deriveSeenIds();
    setHearted(deriveHeartedIds());
    setSeen(seenIds);
    setInitialSeen(seenIds);
    setGenerated(readGenerated());
    setHydrated(true);
  }, []);

  const deck = useMemo(() => {
    if (!hydrated) return [] as Card[];
    const built = buildDeck({
      seed: SEED_CARDS,
      generated,
      seenIds: initialSeen,
    });
    return avoidBackToBackCategory(built);
  }, [hydrated, generated, initialSeen]);

  // Top-up trigger
  useEffect(() => {
    if (!hydrated || topupInflight) return;
    const unseen = countUnseen(deck, seen);
    if (unseen >= TOPUP_UNSEEN_THRESHOLD) return;

    const settings = readSettings();
    if (!settings.apiKey) return;

    let calls = settings.topupCallsToday;
    let stamp = settings.topupDayStamp;
    if (stamp !== todayStamp()) {
      calls = 0;
      stamp = todayStamp();
    }
    if (calls >= TOPUP_DAILY_LIMIT) return;

    setTopupInflight(true);
    void (async () => {
      try {
        const cat = TOP_UP_CATEGORIES[Math.floor(Math.random() * TOP_UP_CATEGORIES.length)];
        const newCards = await generateCards({
          apiKey: settings.apiKey!,
          category: cat,
          count: 5,
          existingIds: new Set([
            ...SEED_CARDS.map((c) => c.id),
            ...generated.map((c) => c.id),
          ]),
        });
        if (newCards.length > 0) {
          const merged = appendGenerated(newCards, {
            seenIds: seen,
            heartedIds: hearted,
          });
          setGenerated(merged);
        }
        writeSettings({
          topupCallsToday: calls + 1,
          topupDayStamp: stamp,
        });
      } catch (err) {
        console.warn("Top-up failed:", err);
      } finally {
        setTopupInflight(false);
      }
    })();
  }, [hydrated, deck, seen, hearted, generated, topupInflight]);

  const handleSeen = (card: Card) => {
    if (seen.has(card.id)) return;
    logEvent(card, "seen");
    setSeen((s) => {
      const next = new Set(s);
      next.add(card.id);
      return next;
    });
  };

  const handleAdvance = (card: Card) => {
    logEvent(card, "advanced");
  };

  const handleToggleHeart = (card: Card) => {
    const isHearted = hearted.has(card.id);
    logEvent(card, isHearted ? "unhearted" : "hearted");
    setHearted((h) => {
      const next = new Set(h);
      if (isHearted) next.delete(card.id);
      else next.add(card.id);
      return next;
    });
  };

  const handleSessionEnd = () => {
    // No-op for now; Deck shows its own end screen.
  };

  const heartedCards = useMemo(() => {
    const allById = new Map<string, Card>();
    for (const c of SEED_CARDS) allById.set(c.id, c);
    for (const c of generated) if (!allById.has(c.id)) allById.set(c.id, c);
    return [...hearted].map((id) => allById.get(id)).filter((c): c is Card => !!c);
  }, [hearted, generated]);

  if (!hydrated) {
    return (
      <main className="h-screen-d w-full flex items-center justify-center bg-ink text-paper/40">
        <div className="font-serif text-lg">Mindful</div>
      </main>
    );
  }

  return (
    <main className="h-screen-d w-full bg-ink text-paper">
      <Deck
        cards={deck}
        heartedIds={hearted}
        onSeen={handleSeen}
        onAdvance={handleAdvance}
        onToggleHeart={handleToggleHeart}
        onSessionEnd={handleSessionEnd}
        onOpenSaved={() => setSavedOpen(true)}
        onOpenSettings={() => router.push("/settings")}
      />
      <SavedSheet
        open={savedOpen}
        onClose={() => setSavedOpen(false)}
        cards={heartedCards}
      />
    </main>
  );
}
