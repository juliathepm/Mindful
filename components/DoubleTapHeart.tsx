"use client";

import { useCallback, useRef, useState } from "react";

const DOUBLE_TAP_MS = 300;
const DOUBLE_TAP_PX = 24;

type Burst = { id: number; x: number; y: number; pop: boolean };

export function DoubleTapHeart({
  hearted,
  onToggle,
  children,
}: {
  hearted: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const lastTap = useRef<{ ts: number; x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [bursts, setBursts] = useState<Burst[]>([]);
  const [reducedMotion] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch {
      return false;
    }
  });

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      // Only count primary pointer ups
      if (e.pointerType !== "touch" && e.pointerType !== "mouse" && e.pointerType !== "pen")
        return;

      const now = Date.now();
      const target = e.target as HTMLElement | null;
      // Don't double-tap-heart on links/buttons/inputs
      if (target && target.closest("a, button, input, textarea, select, label, [data-no-heart]")) {
        lastTap.current = null;
        return;
      }

      const rect = containerRef.current?.getBoundingClientRect();
      const localX = rect ? e.clientX - rect.left : e.clientX;
      const localY = rect ? e.clientY - rect.top : e.clientY;
      const last = lastTap.current;

      if (
        last &&
        now - last.ts < DOUBLE_TAP_MS &&
        Math.abs(e.clientX - last.x) < DOUBLE_TAP_PX &&
        Math.abs(e.clientY - last.y) < DOUBLE_TAP_PX
      ) {
        // Double-tap detected
        lastTap.current = null;
        onToggle();
        if (!reducedMotion) {
          const id = now + Math.random();
          setBursts((b) => [...b, { id, x: localX, y: localY, pop: !hearted }]);
          window.setTimeout(() => {
            setBursts((b) => b.filter((x) => x.id !== id));
          }, 800);
        }
      } else {
        lastTap.current = { ts: now, x: e.clientX, y: e.clientY };
      }
    },
    [onToggle, hearted, reducedMotion],
  );

  return (
    <div
      ref={containerRef}
      onPointerUp={onPointerUp}
      className="relative h-full w-full no-zoom"
    >
      {children}
      {bursts.map((b) => (
        <div
          key={b.id}
          className="pointer-events-none absolute heart-burst"
          style={{
            left: b.x,
            top: b.y,
            transform: "translate(-50%, -50%)",
            fontSize: "6rem",
            filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.4))",
            color: b.pop ? "#ff6b81" : "#ffffff",
          }}
          aria-hidden
        >
          {b.pop ? "❤️" : "💔"}
        </div>
      ))}
    </div>
  );
}
