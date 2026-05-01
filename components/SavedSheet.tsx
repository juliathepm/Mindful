"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { Card as CardT } from "@/lib/types";
import { CategoryChip } from "./CategoryChip";
import { CATEGORY_GRADIENT } from "@/lib/types";

export function SavedSheet({
  open,
  onClose,
  cards,
}: {
  open: boolean;
  onClose: () => void;
  cards: CardT[];
}) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.div
            className="fixed inset-0 bg-black/60 z-30"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed left-0 right-0 bottom-0 z-40 bg-ink rounded-t-3xl border-t border-paper/10 max-h-[85dvh] overflow-y-auto"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            style={{ paddingBottom: "max(1rem, var(--safe-bottom))" }}
          >
            <div className="sticky top-0 bg-ink/95 backdrop-blur px-5 pt-3 pb-2 border-b border-paper/10 flex items-center justify-between">
              <div>
                <div className="font-serif text-xl">Saved</div>
                <div className="text-xs text-paper/60">
                  {cards.length} hearted
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-paper/70 px-3 py-1 rounded-full bg-paper/10 active:bg-paper/20 text-sm"
              >
                Close
              </button>
            </div>
            {cards.length === 0 ? (
              <div className="p-8 text-center text-paper/55 text-sm">
                Nothing saved yet. Double-tap a card to heart it.
              </div>
            ) : (
              <ul className="px-3 py-2 grid gap-2">
                {cards.map((c) => {
                  const [g1, g2] = CATEGORY_GRADIENT[c.category];
                  return (
                    <li
                      key={c.id}
                      className="rounded-2xl overflow-hidden border border-paper/10 bg-paper/[0.03]"
                    >
                      <div className="flex">
                        <div
                          className="w-20 h-20 flex-shrink-0 flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
                        >
                          {c.image.kind === "gradient" && c.image.emoji ? (
                            <span style={{ fontSize: "2rem" }}>{c.image.emoji}</span>
                          ) : null}
                        </div>
                        <div className="flex-1 p-3 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <CategoryChip category={c.category} />
                          </div>
                          <div className="font-serif text-base leading-tight truncate">
                            {c.title}
                          </div>
                          {c.subtitle ? (
                            <div className="text-xs text-paper/50 truncate">
                              {c.subtitle}
                            </div>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
