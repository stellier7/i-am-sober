import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import Dashboard from "@/components/Dashboard";

export const dynamic = "force-dynamic";

export default async function Home() {
  if (!isSupabaseConfigured()) redirect("/login");

  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("sober_since, reasons")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  const today = new Date().toISOString().slice(0, 10);
  const { data: todayEntry } = await supabase
    .from("entries")
    .select("pledged, note")
    .eq("user_id", user.id)
    .eq("entry_date", today)
    .maybeSingle();

  return (
    <Dashboard
      userId={user.id}
      soberSince={profile.sober_since}
      reasons={profile.reasons ?? []}
      todayPledged={todayEntry?.pledged ?? false}
      todayNote={todayEntry?.note ?? null}
    />
  );
}
