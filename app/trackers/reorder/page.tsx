import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import TrackerReorderList from "@/components/TrackerReorderList";
import type { Tracker } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TrackerReorderPage() {
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
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!trackers || trackers.length === 0) redirect("/onboarding");
  if (trackers.length === 1) redirect("/");

  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <Link href="/" className="text-xs text-mist hover:text-paper">
        ← Back
      </Link>
      <TrackerReorderList trackers={trackers as Tracker[]} />
    </main>
  );
}
