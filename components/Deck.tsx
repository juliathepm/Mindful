"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Card as CardT } from "@/lib/types";
import { SESSION_CARD_LIMIT, SESSION_MS_LIMIT } from "@/lib/types";
import { Card } from "./Card";
import { DoubleTapHeart } from "./DoubleTapHeart";

type Props = {
  cards: CardT[];
  initialIndex?: number;
  heartedIds: Set<string>;
  onAdvance: (card: CardT, fromIndex: number) => void;
  onSeen: (card: CardT) => void;
  onToggleHeart: (card: CardT) => void;
  onSessionEnd: () => void;
  onOpenSaved: () => void;
  onOpenSettings: () => void;
};

const DRAG_THRESHOLD_FRAC = 0.25;
const VELOCITY_THRESHOLD = 500;
const DIRECTION_LOCK_RATIO = 1.5;

export function Deck(props: Props) {
  const {
    cards,
    initialIndex = 0,
    heartedIds,
    onAdvance,
    onSeen,
    onToggleHeart,
    onSessionEnd,
    onOpenSaved,
    onOpenSettings,
  } = props;

  const [index, setIndex] = useState(initialIndex);
  const [maxIndex, setMaxIndex] = useState(initialIndex);
  const [sessionStart] = useState(() => Date.now());
  const [sessionCount, setSessionCount] = useState(0);
  const [sessionEnded, setSessionEnded] = useState(false);

  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [w, setW] = useState(0);
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const update = () => setW(containerRef.current?.clientWidth ?? window.innerWidth);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Log "seen" for the visible card the first time it's shown
  useEffect(() => {
    const card = cards[index];
    if (!card) return;
    if (!seenRef.current.has(card.id)) {
      seenRef.current.add(card.id);
      onSeen(card);
    }
  }, [index, cards, onSeen]);

  // Session timer cap
  useEffect(() => {
    const remaining = SESSION_MS_LIMIT - (Date.now() - sessionStart);
    if (remaining <= 0) {
      setSessionEnded(true);
      return;
    }
    const t = window.setTimeout(() => setSessionEnded(true), remaining);
    return () => window.clearTimeout(t);
  }, [sessionStart]);

  useEffect(() => {
    if (sessionEnded) onSessionEnd();
  }, [sessionEnded, onSessionEnd]);

  const goForward = () => {
    const cur = cards[index];
    if (!cur) return;
    animate(x, w * 1.2, {
      duration: 0.28,
      ease: [0.32, 0.72, 0.34, 1],
      onComplete: () => {
        onAdvance(cur, index);
        const nextIdx = index + 1;
        if (nextIdx > maxIndex) {
          setMaxIndex(nextIdx);
          const nextCount = sessionCount + 1;
          setSessionCount(nextCount);
          if (nextCount >= SESSION_CARD_LIMIT) {
            setSessionEnded(true);
          }
        }
        x.set(0);
        setIndex(nextIdx);
      },
    });
  };

  const goBack = () => {
    if (index <= 0) {
      animate(x, 0, { type: "spring", stiffness: 360, damping: 36 });
      return;
    }
    animate(x, -w * 1.2, {
      duration: 0.28,
      ease: [0.32, 0.72, 0.34, 1],
      onComplete: () => {
        x.set(0);
        setIndex(index - 1);
      },
    });
  };

  const card = cards[index];
  const nextCard = cards[index + 1];
  const prevCard = index > 0 ? cards[index - 1] : null;

  const rotate = useTransform(x, [-w, 0, w], [-6, 0, 6]);
  const cardOpacity = useTransform(x, [-w, 0, w], [0.3, 1, 0.3]);
  // Peek opacities: next-card peeks when dragging right (forward); prev when left (back).
  const nextPeekOpacity = useTransform(x, [0, w * 0.4], [0, 0.5]);
  const prevPeekOpacity = useTransform(x, [-w * 0.4, 0], [0.5, 0]);

  if (sessionEnded) {
    return (
      <EndOfSessionScreen
        cards={cards.slice(initialIndex, maxIndex)}
        heartedIds={heartedIds}
        onOpenSaved={onOpenSaved}
      />
    );
  }

  return (
    <div className="h-screen-d w-full flex flex-col bg-ink no-zoom no-select">
      {/* Top bar — sits above the image rather than overlaying it */}
      <header
        className="flex-none flex items-center justify-between px-4 pb-2 bg-ink"
        style={{ paddingTop: "max(0.5rem, var(--safe-top))" }}
      >
        <button
          type="button"
          aria-label="Open saved cards"
          onClick={onOpenSaved}
          className="rounded-full bg-paper/10 px-3 py-1.5 text-xs text-paper/85 active:bg-paper/20"
        >
          ♥ {heartedIds.size}
        </button>
        <button
          type="button"
          aria-label="Open settings"
          onClick={onOpenSettings}
          className="rounded-full bg-paper/10 px-3 py-1.5 text-xs text-paper/85 active:bg-paper/20"
        >
          ⚙
        </button>
      </header>

      {/* Card area */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden"
        style={{ touchAction: "pan-y" }}
      >
        {!card ? (
          <div className="absolute inset-0 flex items-center justify-center text-center px-8 text-paper/70">
            <div>
              <div className="text-paper/50 text-sm mb-2">No more cards</div>
              <div className="font-serif text-2xl">Come back tomorrow.</div>
            </div>
          </div>
        ) : (
          <>
            {/* Peek behind: previous card when dragging back, next card when dragging forward */}
            {prevCard ? (
              <motion.div
                className="absolute inset-0 z-0 scale-[0.96]"
                style={{ opacity: prevPeekOpacity }}
              >
                <Card card={prevCard} />
              </motion.div>
            ) : null}
            {nextCard ? (
              <motion.div
                className="absolute inset-0 z-0 scale-[0.96]"
                style={{ opacity: nextPeekOpacity }}
              >
                <Card card={nextCard} />
              </motion.div>
            ) : null}

            {/* Active card */}
            <motion.div
              key={card.id}
              className="absolute inset-0 z-10"
              style={{ x, rotate, opacity: cardOpacity }}
              drag="x"
              dragDirectionLock
              dragElastic={0.18}
              dragConstraints={{ left: -w, right: w }}
              onDragEnd={(_, info) => {
                const { offset, velocity } = info;
                const horizontalDominant =
                  Math.abs(offset.x) > Math.abs(offset.y) * DIRECTION_LOCK_RATIO;
                const past =
                  horizontalDominant &&
                  (Math.abs(offset.x) > w * DRAG_THRESHOLD_FRAC ||
                    Math.abs(velocity.x) > VELOCITY_THRESHOLD);
                if (past && offset.x > 0) {
                  goForward();
                } else if (past && offset.x < 0) {
                  goBack();
                } else {
                  animate(x, 0, { type: "spring", stiffness: 360, damping: 36 });
                }
              }}
            >
              <DoubleTapHeart
                hearted={heartedIds.has(card.id)}
                onToggle={() => onToggleHeart(card)}
              >
                <Card card={card} />
              </DoubleTapHeart>
            </motion.div>

            <button
              type="button"
              onClick={() => onToggleHeart(card)}
              aria-label={heartedIds.has(card.id) ? "Unheart this card" : "Heart this card"}
              data-no-heart
              className="absolute z-20 left-4 rounded-full bg-paper/15 active:bg-paper/30 backdrop-blur text-paper px-4 py-3 text-base"
              style={{ bottom: "max(1rem, calc(var(--safe-bottom) + 0.5rem))" }}
            >
              {heartedIds.has(card.id) ? "♥" : "♡"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function EndOfSessionScreen({
  cards,
  heartedIds,
  onOpenSaved,
}: {
  cards: CardT[];
  heartedIds: Set<string>;
  onOpenSaved: () => void;
}) {
  const heartedNow = cards.filter((c) => heartedIds.has(c.id)).length;
  return (
    <div className="h-screen-d w-full flex flex-col items-center justify-center text-center px-8">
      <div className="text-5xl mb-4">🌿</div>
      <div className="font-serif text-2xl mb-2">That's enough for now.</div>
      <div className="text-paper/65 mb-6 max-w-xs">
        You looked at {cards.length} card{cards.length === 1 ? "" : "s"} and
        hearted {heartedNow}. Come back later — your brain doesn't need
        another scroll.
      </div>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onOpenSaved}
          className="rounded-full bg-paper/15 active:bg-paper/30 px-5 py-2 text-sm"
        >
          See saved
        </button>
        <button
          type="button"
          onClick={() => {
            if (typeof window !== "undefined") window.close();
          }}
          className="rounded-full bg-paper text-ink px-5 py-2 text-sm font-medium"
        >
          Close
        </button>
      </div>
    </div>
  );
}
