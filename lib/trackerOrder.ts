import type { SupabaseClient } from "@supabase/supabase-js";

export async function nextTrackerSortOrder(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { data } = await supabase
    .from("trackers")
    .select("sort_order")
    .eq("user_id", userId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.sort_order ?? -1) + 1;
}
