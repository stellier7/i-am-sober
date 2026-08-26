"use client";

import Link from "next/link";
import DawnArc from "@/components/DawnArc";
import Counter from "@/components/Counter";
import MilestoneStrip from "@/components/MilestoneStrip";
import PledgeCard from "@/components/PledgeCard";
import ReasonsCard from "@/components/ReasonsCard";
import QuoteCard from "@/components/QuoteCard";
import { useSoberStats } from "@/lib/useSoberStats";
import { getSubstanceEmoji, getSubstanceLabel } from "@/lib/substances";
import type { Tracker } from "@/lib/types";

export default function TrackerCard({
  tracker,
  userId,
  todayPledged,
  todayNote,
  isActive = true,
  focusOffset = 0,
}: {
  tracker: Tracker;
  userId: string;
  todayPledged: boolean;
  todayNote: string | null;
  isActive?: boolean;
  focusOffset?: number;
}) {
  const stats = useSoberStats(tracker.sober_since);
  const label = getSubstanceLabel(tracker.substance, tracker.label);
  const emoji = getSubstanceEmoji(tracker.substance);
  const parallaxShift = focusOffset * -18;

  return (
    <article className="flex h-full w-full flex-col">
      <div
        className="mb-4 flex items-center justify-between gap-2 px-1 animate-fade-up"
        style={{ animationDelay: "0ms" }}
      >
        <div className="flex items-center gap-2.5">
          <span
            className={`text-2xl transition-transform duration-500 ${isActive ? "animate-float" : ""}`}
            aria-hidden
          >
            {emoji}
          </span>
          <h2 className="font-display text-xl text-paper">{label}</h2>
        </div>
        <Link
          href={`/trackers/${tracker.id}`}
          className="rounded-full border border-surface2 px-3 py-1 text-xs text-mist hover:border-gold/30 hover:text-paper transition-colors"
        >
          Settings
        </Link>
      </div>

      <div
        className="hero-card rounded-3xl overflow-hidden animate-fade-up"
        style={{
          animationDelay: "80ms",
          transform: `translateX(${parallaxShift * 0.3}px)`,
          transition: "transform 0.3s ease-out",
        }}
      >
        <DawnArc progress={stats.progress} />
        <div className="px-5 pb-6 -mt-8 relative">
          <Counter stats={stats} isActive={isActive} />
        </div>
      </div>

      <QuoteCard trackerId={tracker.id} />

      {stats.nextMilestone && (
        <p
          className="text-center text-sm text-mist mt-3 px-1 animate-fade-up"
          style={{ animationDelay: "140ms" }}
        >
          {stats.daysToNextMilestone} day{stats.daysToNextMilestone === 1 ? "" : "s"} to your{" "}
          {stats.nextMilestone < 365 ? `${stats.nextMilestone}-day` : "1-year"} milestone
        </p>
      )}

      <div
        className="mt-4 glass-card rounded-2xl p-5 animate-fade-up"
        style={{
          animationDelay: "200ms",
          transform: `translateX(${parallaxShift * 0.5}px)`,
          transition: "transform 0.3s ease-out",
        }}
      >
        <MilestoneStrip totalDays={stats.totalDays} />
      </div>

      <div
        className="mt-4 animate-fade-up"
        style={{
          animationDelay: "260ms",
          transform: `translateX(${parallaxShift * 0.65}px)`,
          transition: "transform 0.3s ease-out",
        }}
      >
        <PledgeCard
          userId={userId}
          trackerId={tracker.id}
          substanceLabel={label}
          todayPledged={todayPledged}
          todayNote={todayNote}
        />
      </div>

      <div
        className="animate-fade-up"
        style={{
          animationDelay: "320ms",
          transform: `translateX(${parallaxShift * 0.8}px)`,
          transition: "transform 0.3s ease-out",
        }}
      >
        <ReasonsCard
          trackerId={tracker.id}
          substanceLabel={label}
          reasons={tracker.reasons}
        />
      </div>
    </article>
  );
}
