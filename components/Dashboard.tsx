"use client";

import Link from "next/link";
import TrackerCarousel from "@/components/TrackerCarousel";
import { createClient } from "@/lib/supabase/client";
import type { Tracker, TrackerEntry } from "@/lib/types";
import { useRouter } from "next/navigation";

export default function Dashboard({
  userId,
  trackers,
  todayEntries,
}: {
  userId: string;
  trackers: Tracker[];
  todayEntries: Record<string, TrackerEntry>;
}) {
  const router = useRouter();

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      <div className="ambient-bg" aria-hidden />

      <main className="relative z-10 mx-auto max-w-md px-5 pb-16 pt-8">
        <div
          className="flex items-center justify-between mb-6 animate-fade-up"
          style={{ animationDelay: "0ms" }}
        >
          <h1 className="font-display italic text-2xl text-paper tracking-tight">iAmSober</h1>
          <button
            onClick={signOut}
            className="rounded-full border border-surface2 px-3 py-1 text-xs text-mist hover:border-gold/30 hover:text-paper transition-colors"
          >
            Sign out
          </button>
        </div>

        <TrackerCarousel trackers={trackers} userId={userId} todayEntries={todayEntries} />

        {trackers.length > 1 && (
          <Link
            href="/trackers/reorder"
            className="mt-4 block text-center text-xs text-mist hover:text-paper transition-colors animate-fade-up"
            style={{ animationDelay: "400ms" }}
          >
            Reorder trackers
          </Link>
        )}

        <Link
          href="/trackers/new"
          className="mt-6 block text-center rounded-2xl border border-dashed border-surface2 py-3 text-sm text-mist hover:border-gold/50 hover:text-paper hover:bg-surface/30 transition-all duration-200 animate-fade-up"
          style={{ animationDelay: "460ms" }}
        >
          + Add another substance
        </Link>

        <Link
          href="/journal"
          className="mt-3 block text-center rounded-2xl glass-card py-3 text-sm text-paper hover:border-gold/20 transition-all duration-200 animate-fade-up"
          style={{ animationDelay: "520ms" }}
        >
          Open journal →
        </Link>
      </main>
    </>
  );
}
