"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getSubstanceEmoji, getSubstanceLabel } from "@/lib/substances";
import type { Tracker } from "@/lib/types";

export default function TrackerReorderList({ trackers }: { trackers: Tracker[] }) {
  const router = useRouter();
  const [order, setOrder] = useState(trackers.map((t) => t.id));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const byId = Object.fromEntries(trackers.map((t) => [t.id, t]));

  function move(id: string, direction: -1 | 1) {
    setOrder((prev) => {
      const index = prev.indexOf(id);
      const nextIndex = index + direction;
      if (index < 0 || nextIndex < 0 || nextIndex >= prev.length) return prev;
      const copy = [...prev];
      [copy[index], copy[nextIndex]] = [copy[nextIndex], copy[index]];
      return copy;
    });
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const results = await Promise.all(
      order.map((id, index) =>
        supabase.from("trackers").update({ sort_order: index }).eq("id", id)
      )
    );
    const failed = results.find((r) => r.error);
    setSaving(false);
    if (failed?.error) {
      setError(failed.error.message);
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <>
      <h1 className="mt-6 font-display italic text-2xl text-paper">Reorder trackers</h1>
      <p className="mt-1 text-sm text-mist">The first one shows up first on your dashboard.</p>

      <ul className="mt-8 space-y-2">
        {order.map((id, index) => {
          const tracker = byId[id];
          if (!tracker) return null;
          const label = getSubstanceLabel(tracker.substance, tracker.label);
          const emoji = getSubstanceEmoji(tracker.substance);

          return (
            <li
              key={id}
              className="flex items-center gap-3 rounded-2xl bg-surface px-4 py-3"
            >
              <span className="font-mono text-sm text-mist w-5">{index + 1}</span>
              <span className="text-lg" aria-hidden>
                {emoji}
              </span>
              <span className="flex-1 text-sm text-paper">{label}</span>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => move(id, -1)}
                  disabled={index === 0 || saving}
                  className="rounded-lg bg-surface2 px-2.5 py-1.5 text-xs text-paper disabled:opacity-30"
                  aria-label={`Move ${label} up`}
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(id, 1)}
                  disabled={index === order.length - 1 || saving}
                  className="rounded-lg bg-surface2 px-2.5 py-1.5 text-xs text-paper disabled:opacity-30"
                  aria-label={`Move ${label} down`}
                >
                  ↓
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-8 w-full rounded-xl bg-gold text-ink font-medium py-3 disabled:opacity-60"
      >
        {saving ? "Saving…" : saved ? "Saved!" : "Save order"}
      </button>

      {error && <p className="mt-2 text-xs text-rose text-center">{error}</p>}
    </>
  );
}
