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
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: trackers } = await supabase
    .from("trackers")
    .select("id, substance, label, sober_since, reasons")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (!trackers || trackers.length === 0) redirect("/onboarding");

  const today = new Date().toISOString().slice(0, 10);
  const trackerIds = trackers.map((t) => t.id);
  const { data: todayEntriesRaw } = await supabase
    .from("entries")
    .select("tracker_id, pledged, note")
    .in("tracker_id", trackerIds)
    .eq("entry_date", today);

  const todayEntries: Record<string, TrackerEntry> = {};
  for (const entry of todayEntriesRaw ?? []) {
    todayEntries[entry.tracker_id] = entry;
  }

  return (
    <Dashboard
      userId={user.id}
      trackers={trackers as Tracker[]}
      todayEntries={todayEntries}
    />
  );
}
