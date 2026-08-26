"use client";

import Link from "next/link";
import DawnArc from "@/components/DawnArc";
import Counter from "@/components/Counter";
import MilestoneStrip from "@/components/MilestoneStrip";
import PledgeCard from "@/components/PledgeCard";
import { useSoberStats } from "@/lib/useSoberStats";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export default function Dashboard({
  userId,
  soberSince,
  reasons,
  todayPledged,
  todayNote,
}: {
  userId: string;
  soberSince: string;
  reasons: string[];
  todayPledged: boolean;
  todayNote: string | null;
}) {
  const stats = useSoberStats(soberSince);
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-md px-5 pb-16 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display italic text-2xl text-paper">Daybreak</h1>
        <button onClick={signOut} className="text-xs text-mist hover:text-paper">
          Sign out
        </button>
      </div>

      <div className="rounded-2xl bg-surface overflow-hidden">
        <DawnArc progress={stats.progress} />
        <div className="px-5 pb-6 -mt-8 relative">
          <Counter stats={stats} />
        </div>
      </div>

      {stats.nextMilestone && (
        <p className="text-center text-sm text-mist mt-3">
          {stats.daysToNextMilestone} day{stats.daysToNextMilestone === 1 ? "" : "s"} to your{" "}
          {stats.nextMilestone < 365 ? `${stats.nextMilestone}-day` : "1-year"} milestone
        </p>
      )}

      <div className="mt-6 rounded-2xl bg-surface p-5">
        <MilestoneStrip totalDays={stats.totalDays} />
      </div>

      <div className="mt-6">
        <PledgeCard userId={userId} todayPledged={todayPledged} todayNote={todayNote} />
      </div>

      {reasons.length > 0 && (
        <div className="mt-6 rounded-2xl bg-surface p-5">
          <h2 className="font-display text-lg text-paper mb-2">Why you started</h2>
          <ul className="space-y-1.5">
            {reasons.map((r, i) => (
              <li key={i} className="text-sm text-mist flex gap-2">
                <span className="text-gold">·</span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Link
        href="/journal"
        className="mt-6 block text-center rounded-2xl border border-surface2 py-3 text-sm text-paper hover:bg-surface transition-colors"
      >
        Open journal →
      </Link>
    </main>
  );
}
