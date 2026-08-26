import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import TrackerSettingsForm from "@/components/TrackerSettingsForm";
import type { Tracker } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TrackerSettingsPage({
  params,
}: {
  params: { id: string };
}) {
  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: tracker } = await supabase
    .from("trackers")
    .select("id, substance, label, sober_since, reasons")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!tracker) notFound();

  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <Link href="/" className="text-xs text-mist hover:text-paper">
        ← Back
      </Link>
      <TrackerSettingsForm tracker={tracker as Tracker} />
    </main>
  );
}
