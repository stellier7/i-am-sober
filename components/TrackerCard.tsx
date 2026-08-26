"use client";

import DawnArc from "@/components/DawnArc";
import Counter from "@/components/Counter";
import MilestoneStrip from "@/components/MilestoneStrip";
import PledgeCard from "@/components/PledgeCard";
import { useSoberStats } from "@/lib/useSoberStats";
import { getSubstanceEmoji, getSubstanceLabel } from "@/lib/substances";
import type { Tracker } from "@/lib/types";

export default function TrackerCard({
  tracker,
  userId,
  todayPledged,
  todayNote,
}: {
  tracker: Tracker;
  userId: string;
  todayPledged: boolean;
  todayNote: string | null;
}) {
  const stats = useSoberStats(tracker.sober_since);
  const label = getSubstanceLabel(tracker.substance, tracker.label);
  const emoji = getSubstanceEmoji(tracker.substance);

  return (
    <article className="flex h-full w-full flex-col">
      <div className="mb-3 flex items-center gap-2 px-1">
        <span className="text-xl" aria-hidden>
          {emoji}
        </span>
        <h2 className="font-display text-xl text-paper">{label}</h2>
      </div>

      <div className="rounded-2xl bg-surface overflow-hidden">
        <DawnArc progress={stats.progress} />
        <div className="px-5 pb-6 -mt-8 relative">
          <Counter stats={stats} />
        </div>
      </div>

      {stats.nextMilestone && (
        <p className="text-center text-sm text-mist mt-3 px-1">
          {stats.daysToNextMilestone} day{stats.daysToNextMilestone === 1 ? "" : "s"} to your{" "}
          {stats.nextMilestone < 365 ? `${stats.nextMilestone}-day` : "1-year"} milestone
        </p>
      )}

      <div className="mt-4 rounded-2xl bg-surface p-5">
        <MilestoneStrip totalDays={stats.totalDays} />
      </div>

      <div className="mt-4">
        <PledgeCard
          userId={userId}
          trackerId={tracker.id}
          substanceLabel={label}
          todayPledged={todayPledged}
          todayNote={todayNote}
        />
      </div>

      {tracker.reasons.length > 0 && (
        <div className="mt-4 rounded-2xl bg-surface p-5">
          <h3 className="font-display text-lg text-paper mb-2">Why you started</h3>
          <ul className="space-y-1.5">
            {tracker.reasons.map((r, i) => (
              <li key={i} className="text-sm text-mist flex gap-2">
                <span className="text-gold">·</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
}
