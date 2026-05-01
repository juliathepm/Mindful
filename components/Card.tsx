"use client";

import ReactMarkdown from "react-markdown";
import { useState } from "react";
import type { Card as CardT } from "@/lib/types";
import { CATEGORY_GRADIENT, CATEGORY_LABEL } from "@/lib/types";
import { CategoryChip } from "./CategoryChip";

const SAFE_LINK = /^(https?:|mailto:)/i;

function urlTransform(url: string): string {
  return SAFE_LINK.test(url) ? url : "";
}

function ImageHeader({ card, onError }: { card: CardT; onError: () => void }) {
  const [g1, g2] = CATEGORY_GRADIENT[card.category];
  if (card.image.kind === "url") {
    return (
      <div
        className="w-full aspect-[4/3] overflow-hidden relative"
        style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={card.image.url}
          alt={card.image.alt}
          loading="lazy"
          decoding="async"
          onError={onError}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }
  // gradient + emoji
  return (
    <div
      className="w-full aspect-[4/3] flex items-center justify-center"
      style={{ background: `linear-gradient(135deg, ${g1}, ${g2})` }}
      aria-hidden={!card.image.emoji}
    >
      {card.image.emoji ? (
        <span style={{ fontSize: "7rem", lineHeight: 1 }}>{card.image.emoji}</span>
      ) : null}
    </div>
  );
}

export function Card({ card }: { card: CardT }) {
  const [imgFailed, setImgFailed] = useState(false);
  const effective: CardT = imgFailed && card.image.kind === "url"
    ? { ...card, image: { kind: "gradient", seed: card.id, emoji: "✨" } }
    : card;

  return (
    <article className="h-full w-full overflow-y-auto overscroll-contain bg-ink text-paper">
      <header>
        <ImageHeader card={effective} onError={() => setImgFailed(true)} />
        {card.image.kind === "url" && !imgFailed ? (
          <div className="px-5 pt-2 text-[11px] text-paper/50">
            Photo: {card.image.author} ·{" "}
            <a
              href={card.image.sourceUrl}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              source
            </a>{" "}
            ·{" "}
            <a
              href={card.image.licenseUrl}
              target="_blank"
              rel="noreferrer"
              className="underline"
            >
              {card.image.license}
            </a>
          </div>
        ) : null}
      </header>

      <div className="px-5 pt-4 pb-2 flex items-center gap-2">
        <CategoryChip category={card.category} />
        {card.origin === "generated" ? (
          <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-paper/30 text-paper/70">
            Generated
          </span>
        ) : null}
      </div>

      <div className="px-5 pb-2">
        <h1 className="font-serif text-3xl leading-tight tracking-tight">{card.title}</h1>
        {card.subtitle ? (
          <p className="text-paper/60 mt-1 text-sm">{card.subtitle}</p>
        ) : null}
      </div>

      <div className="px-5 pt-3 prose-card text-paper/90">
        <ReactMarkdown
          urlTransform={urlTransform}
          allowedElements={["p", "strong", "em", "a", "code", "br"]}
          unwrapDisallowed
        >
          {card.body}
        </ReactMarkdown>
      </div>

      {card.takeaway ? (
        <div className="mx-5 mt-5 rounded-2xl border border-paper/15 p-4">
          <div className="text-[11px] uppercase tracking-wider text-paper/50 mb-1">
            Takeaway
          </div>
          <div className="font-serif text-lg leading-snug">{card.takeaway}</div>
        </div>
      ) : null}

      {card.category === "big_question" && "framings" in card ? (
        <div className="px-5 mt-5">
          <div className="text-[11px] uppercase tracking-wider text-paper/50 mb-2">
            Framings
          </div>
          <ul className="space-y-3">
            {card.framings.map((f, i) => (
              <li key={i} className="prose-card text-paper/85">
                <ReactMarkdown
                  urlTransform={urlTransform}
                  allowedElements={["p", "strong", "em", "a", "code"]}
                  unwrapDisallowed
                >
                  {f}
                </ReactMarkdown>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {card.sources && card.sources.length > 0 ? (
        <div className="px-5 mt-5">
          <div className="text-[11px] uppercase tracking-wider text-paper/50 mb-2">
            Sources
          </div>
          <ul className="space-y-1 text-sm">
            {card.sources.map((s, i) => (
              <li key={i}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-paper/80"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="text-center text-paper/30 text-xs mt-8 mb-10 select-none">
        <span aria-label="end of card">— · —</span>
      </div>
      <div style={{ height: "max(1.5rem, var(--safe-bottom))" }} />
    </article>
  );
}

export function CardLabel({ category }: { category: CardT["category"] }) {
  return CATEGORY_LABEL[category];
}
