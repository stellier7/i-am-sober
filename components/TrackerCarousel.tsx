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
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [focusOffsets, setFocusOffsets] = useState<number[]>(() => trackers.map(() => 0));
  const [paused, setPaused] = useState(false);
  const pauseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const updateFocus = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return;

    const viewportCenter = container.scrollLeft + container.clientWidth / 2;
    const offsets: number[] = [];
    let closestIndex = 0;
    let closestDistance = Infinity;

    slideRefs.current.forEach((slide, i) => {
      if (!slide) {
        offsets.push(0);
        return;
      }
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const offset = (slideCenter - viewportCenter) / container.clientWidth;
      offsets.push(offset);

      const distance = Math.abs(offset);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = i;
      }
    });

    setFocusOffsets(offsets);
    setActiveIndex(closestIndex);
  }, []);

  const scrollToIndex = useCallback((index: number) => {
    const slide = slideRefs.current[index];
    slide?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }, []);

  const pauseAutoScroll = useCallback(() => {
    setPaused(true);
    if (pauseTimerRef.current) clearTimeout(pauseTimerRef.current);
    pauseTimerRef.current = setTimeout(() => setPaused(false), 12000);
  }, []);

  useEffect(() => {
    if (trackers.length <= 1) return;
    requestAnimationFrame(() => scrollToIndex(0));
  }, [trackers.length, scrollToIndex]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    updateFocus();
    container.addEventListener("scroll", updateFocus, { passive: true });
    window.addEventListener("resize", updateFocus);

    return () => {
      container.removeEventListener("scroll", updateFocus);
      window.removeEventListener("resize", updateFocus);
    };
  }, [trackers.length, updateFocus]);

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

  if (trackers.length === 1) {
    return (
      <div className="mx-auto max-w-sm">
        <TrackerCard
          tracker={trackers[0]}
          userId={userId}
          todayPledged={todayEntries[trackers[0].id]?.pledged ?? false}
          todayNote={todayEntries[trackers[0].id]?.note ?? null}
          isActive
          focusOffset={0}
        />
      </div>
    );
  }

  return (
    <div className="relative -mx-5" style={{ perspective: "1200px" }}>
      <div
        ref={scrollRef}
        className="carousel-track flex snap-x snap-mandatory overflow-x-auto scrollbar-none gap-4 px-5 pb-3"
        style={{ scrollBehavior: "smooth" }}
        onTouchStart={pauseAutoScroll}
        onMouseEnter={pauseAutoScroll}
        onWheel={pauseAutoScroll}
      >
        {trackers.map((tracker, i) => {
          const offset = focusOffsets[i] ?? 0;
          const isActive = i === activeIndex;
          const absOffset = Math.min(Math.abs(offset), 1);
          const scale = 1 - absOffset * 0.06;
          const translateY = absOffset * 14;
          const rotate = offset * 2.5;
          const opacity = 1 - absOffset * 0.35;

          return (
            <div
              key={tracker.id}
              ref={(el) => {
                slideRefs.current[i] = el;
              }}
              className="carousel-slide shrink-0 w-[calc(100%-2.5rem)] transition-[transform,opacity] duration-300 ease-out will-change-transform"
              style={{
                transform: `scale(${scale}) translateY(${translateY}px) rotateY(${rotate}deg)`,
                opacity,
              }}
            >
              <TrackerCard
                tracker={tracker}
                userId={userId}
                todayPledged={todayEntries[tracker.id]?.pledged ?? false}
                todayNote={todayEntries[tracker.id]?.note ?? null}
                isActive={isActive}
                focusOffset={offset}
              />
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex items-center justify-center gap-2">
        {trackers.map((tracker, i) => (
          <button
            key={tracker.id}
            type="button"
            aria-label={`Go to tracker ${i + 1}`}
            onClick={() => {
              pauseAutoScroll();
              scrollToIndex(i);
            }}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === activeIndex
                ? "w-7 bg-gold shadow-[0_0_12px_rgba(232,168,87,0.45)]"
                : "w-2 bg-surface2 hover:bg-mist/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
