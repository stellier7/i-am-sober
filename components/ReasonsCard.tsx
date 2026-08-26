"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ReasonsCard({
  trackerId,
  substanceLabel,
  reasons: initialReasons,
}: {
  trackerId: string;
  substanceLabel: string;
  reasons: string[];
}) {
  const router = useRouter();
  const [reasons, setReasons] = useState(initialReasons);
  const [draft, setDraft] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function persist(nextReasons: string[]) {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("trackers")
      .update({ reasons: nextReasons })
      .eq("id", trackerId);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return false;
    }
    setReasons(nextReasons);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    router.refresh();
    return true;
  }

  async function addReason() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    const next = [...reasons, trimmed];
    const ok = await persist(next);
    if (ok) setDraft("");
  }

  async function removeReason(index: number) {
    const next = reasons.filter((_, i) => i !== index);
    await persist(next);
  }

  return (
    <div className="mt-4 rounded-2xl bg-surface p-5">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-lg text-paper">Why you started</h3>
        {saved && <span className="text-xs text-gold">Saved</span>}
      </div>
      <p className="mt-1 text-xs text-mist">Your reasons for quitting {substanceLabel.toLowerCase()}.</p>

      {reasons.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {reasons.map((r, i) => (
            <li key={i} className="flex items-start justify-between gap-2 text-sm text-mist">
              <span className="flex gap-2">
                <span className="text-gold">·</span>
                {r}
              </span>
              <button
                type="button"
                onClick={() => removeReason(i)}
                disabled={saving}
                className="shrink-0 text-xs text-mist/60 hover:text-rose disabled:opacity-50"
                aria-label={`Remove reason: ${r}`}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-mist/80">No reasons yet — add one below.</p>
      )}

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addReason())}
          placeholder="e.g. Breathe easier, save money…"
          className="flex-1 rounded-xl bg-surface2 p-3 text-sm text-paper placeholder:text-mist/60 focus:outline-none"
        />
        <button
          type="button"
          onClick={addReason}
          disabled={saving || !draft.trim()}
          className="rounded-xl bg-surface2 px-4 text-sm text-paper disabled:opacity-50"
        >
          {saving ? "…" : "Add"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-rose">{error}</p>}
    </div>
  );
}
