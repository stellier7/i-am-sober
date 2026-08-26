import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function JournalPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: entries } = await supabase
    .from("entries")
    .select("entry_date, pledged, note")
    .eq("user_id", user.id)
    .order("entry_date", { ascending: false });

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
          No entries yet. Your daily pledge and notes will show up here.
        </p>
      ) : (
        <ul className="space-y-3">
          {entries.map((e) => (
            <li key={e.entry_date} className="rounded-2xl bg-surface p-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-sm text-paper">
                  {new Date(e.entry_date + "T00:00:00").toLocaleDateString(undefined, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
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
