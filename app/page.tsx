import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import Dashboard from "@/components/Dashboard";
import type { Tracker, TrackerEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

  if (!user) redirect("/login");

  let trackers: Tracker[] | null = null;
  let todayEntries: Record<string, TrackerEntry> = {};

  try {
    const { data: trackerRows, error: trackersError } = await supabase
      .from("trackers")
      .select("id, substance, label, sober_since, reasons")
      .eq("user_id", user.id)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });

    if (trackersError) throw trackersError;

    if (!trackerRows || trackerRows.length === 0) redirect("/onboarding");
    trackers = trackerRows as Tracker[];

    const today = new Date().toISOString().slice(0, 10);
    const trackerIds = trackers.map((t) => t.id);
    const { data: todayEntriesRaw } = await supabase
      .from("entries")
      .select("tracker_id, pledged, note")
      .in("tracker_id", trackerIds)
      .eq("entry_date", today);

    for (const entry of todayEntriesRaw ?? []) {
      todayEntries[entry.tracker_id] = entry;
    }
  } catch (error) {
    if (
      error instanceof Error &&
      (error as { digest?: string }).digest?.startsWith("NEXT_REDIRECT")
    ) {
      throw error;
    }
    return (
      <main className="mx-auto max-w-sm px-6 pt-24 text-center">
        <h1 className="font-display italic text-2xl text-paper">iAmSober</h1>
        <p className="mt-4 text-sm text-mist">
          Couldn&apos;t reach your data just now. Your streak is safe — check
          your connection and try again.
        </p>
        <a
          href="/"
          className="mt-8 inline-block rounded-xl bg-gold px-6 py-3 text-sm font-medium text-ink"
        >
          Try again
        </a>
      </main>
    );
  }

  return (
    <Dashboard
      userId={user.id}
      trackers={trackers as Tracker[]}
      todayEntries={todayEntries}
    />
  );
}
