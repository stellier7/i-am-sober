"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import TrackerCard from "@/components/TrackerCard";
import type { Tracker, TrackerEntry } from "@/lib/types";

const AUTO_SCROLL_MS = 8000;

export default function TrackerCarousel({
  trackers,
  userId,
  todayEntries,
}: {
  trackers: Tracker[];
  userId: string;
  todayEntries: Record<string, TrackerEntry>;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToIndex = useCallback((index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    const slide = container.children[index] as HTMLElement | undefined;
    slide?.scrollIntoView({ behavior: "smooth", inline: "start", block: "nearest" });
  }, []);

  const pauseAutoScroll = useCallback(() => {
    setPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => setPaused(false), 12000);
  }, []);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container || trackers.length <= 1) return;

    const onScroll = () => {
      const width = container.clientWidth;
      if (!width) return;
      const index = Math.round(container.scrollLeft / width);
      setActiveIndex(Math.min(index, trackers.length - 1));
    };

    container.addEventListener("scroll", onScroll, { passive: true });
    return () => container.removeEventListener("scroll", onScroll);
  }, [trackers.length]);

  useEffect(() => {
    if (trackers.length <= 1 || paused) return;

    const id = setInterval(() => {
      setActiveIndex((current) => {
        const next = (current + 1) % trackers.length;
        scrollToIndex(next);
        return next;
      });
    }, AUTO_SCROLL_MS);

    return () => clearInterval(id);
  }, [trackers.length, paused, scrollToIndex]);

  useEffect(() => {
    return () => {
      if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    };
  }, []);

  if (trackers.length === 0) return null;

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex snap-x snap-mandatory overflow-x-auto scrollbar-none -mx-5 px-5 pb-2"
        style={{ scrollBehavior: "smooth" }}
        onTouchStart={pauseAutoScroll}
        onMouseEnter={pauseAutoScroll}
        onWheel={pauseAutoScroll}
      >
        {trackers.map((tracker) => (
          <div
            key={tracker.id}
            className="w-full shrink-0 snap-start snap-always pr-4 last:pr-0"
          >
            <TrackerCard
              tracker={tracker}
              userId={userId}
              todayPledged={todayEntries[tracker.id]?.pledged ?? false}
              todayNote={todayEntries[tracker.id]?.note ?? null}
            />
          </div>
        ))}
      </div>

      {trackers.length > 1 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          {trackers.map((tracker, i) => (
            <button
              key={tracker.id}
              type="button"
              aria-label={`Go to tracker ${i + 1}`}
              onClick={() => {
                pauseAutoScroll();
                setActiveIndex(i);
                scrollToIndex(i);
              }}
              className={`h-2 rounded-full transition-all ${
                i === activeIndex ? "w-6 bg-gold" : "w-2 bg-surface2 hover:bg-mist/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
