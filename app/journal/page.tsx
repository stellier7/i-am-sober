import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getSubstanceLabel } from "@/lib/substances";

export const dynamic = "force-dynamic";

export default async function JournalPage() {
  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: trackers } = await supabase
    .from("trackers")
    .select("id, substance, label")
    .eq("user_id", user.id)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!trackers || trackers.length === 0) redirect("/onboarding");

  const trackerIds = trackers.map((t) => t.id);
  const { data: entries } = await supabase
    .from("entries")
    .select("tracker_id, entry_date, pledged, note")
    .in("tracker_id", trackerIds)
    .order("entry_date", { ascending: false });

  const trackerLabels = Object.fromEntries(
    trackers.map((t) => [t.id, getSubstanceLabel(t.substance, t.label)])
  );

  return (
    <main className="mx-auto max-w-md px-5 pb-16 pt-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display italic text-2xl text-paper">Journal</h1>
        <Link href="/" className="text-xs text-mist hover:text-paper">
          ← Back
        </Link>
      </div>

      {!entries || entries.length === 0 ? (
        <p className="text-sm text-mist">
          No entries yet. Your daily pledges and notes will show up here.
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => (
            <li key={`${e.tracker_id}-${e.entry_date}`} className="rounded-2xl bg-surface p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm text-paper">
                  {new Date(e.entry_date + "T00:00:00").toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span className="text-xs text-mist">{trackerLabels[e.tracker_id]}</span>
              </div>
              <div className="mt-1 flex items-center justify-between">
                {e.pledged && <span className="text-xs text-gold">Pledged</span>}
              </div>
              {e.note && <p className="mt-2 text-sm text-mist">{e.note}</p>}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
