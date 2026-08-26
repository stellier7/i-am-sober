"use client";

import { useMemo, useState } from "react";
import { getDailyQuote, getNextQuote } from "@/lib/quoteOfDay";
import { QUOTE_CATEGORY_LABELS } from "@/lib/quotes";

export default function QuoteCard({ trackerId }: { trackerId: string }) {
  const dailyQuote = useMemo(() => getDailyQuote(trackerId), [trackerId]);
  const [seed, setSeed] = useState(0);
  const quote = seed === 0 ? dailyQuote : getNextQuote(trackerId, seed);

  return (
    <div
      className="mt-4 glass-card rounded-2xl px-5 py-4 animate-fade-up"
      style={{ animationDelay: "120ms" }}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="font-display italic text-[15px] leading-relaxed text-paper/95">
          &ldquo;{quote.text}&rdquo;
        </p>
        <span className="shrink-0 text-gold/80 text-lg leading-none" aria-hidden>
          ✦
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          {quote.author && (
            <p className="text-xs text-mist truncate">— {quote.author}</p>
          )}
          <p className="text-[10px] uppercase tracking-wider text-mist/60 mt-0.5">
            {QUOTE_CATEGORY_LABELS[quote.category]}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSeed((s) => s + 1)}
          className="shrink-0 rounded-full border border-surface2 px-3 py-1 text-[11px] text-mist hover:border-gold/30 hover:text-paper transition-colors"
        >
          Another
        </button>
      </div>
    </div>
  );
}
