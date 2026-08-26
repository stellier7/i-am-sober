"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getSubstanceLabel } from "@/lib/substances";
import type { Tracker } from "@/lib/types";

export default function TrackerSettingsForm({ tracker }: { tracker: Tracker }) {
  const router = useRouter();
  const label = getSubstanceLabel(tracker.substance, tracker.label);
  const [soberSince, setSoberSince] = useState(() =>
    new Date(tracker.sober_since).toISOString().slice(0, 16)
  );
  const [reasonDraft, setReasonDraft] = useState("");
  const [reasons, setReasons] = useState(tracker.reasons);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addReason() {
    if (!reasonDraft.trim()) return;
    setReasons([...reasons, reasonDraft.trim()]);
    setReasonDraft("");
  }

  function removeReason(index: number) {
    setReasons(reasons.filter((_, i) => i !== index));
  }

  async function save() {
    setSaving(true);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("trackers")
      .update({
        sober_since: new Date(soberSince).toISOString(),
        reasons,
      })
      .eq("id", tracker.id);

    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  async function deleteTracker() {
    if (!confirm(`Remove your ${label} tracker? This also deletes its journal entries.`)) return;

    setSaving(true);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("trackers")
      .delete()
      .eq("id", tracker.id);

    setSaving(false);
    if (deleteError) {
      setError(deleteError.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <>
      <h1 className="mt-6 font-display italic text-2xl text-paper">{label} settings</h1>

      <div className="mt-8">
        <label className="text-xs uppercase tracking-wide text-mist">Streak start</label>
        <input
          type="datetime-local"
          value={soberSince}
          onChange={(e) => setSoberSince(e.target.value)}
          className="mt-2 w-full rounded-xl bg-surface p-3 text-sm text-paper focus:outline-none"
        />
        <p className="mt-1 text-xs text-mist/80">Change this to reset your counter.</p>
      </div>

      <div className="mt-6">
        <label className="text-xs uppercase tracking-wide text-mist">Why you started</label>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={reasonDraft}
            onChange={(e) => setReasonDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addReason())}
            placeholder="Add a reason…"
            className="flex-1 rounded-xl bg-surface p-3 text-sm text-paper placeholder:text-mist/60 focus:outline-none"
          />
          <button
            type="button"
            onClick={addReason}
            className="rounded-xl bg-surface2 px-4 text-sm text-paper"
          >
            Add
          </button>
        </div>
        {reasons.length > 0 && (
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
                  className="text-xs text-mist/60 hover:text-rose"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="mt-10 w-full rounded-xl bg-gold text-ink font-medium py-3 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save changes"}
      </button>

      <button
        type="button"
        onClick={deleteTracker}
        disabled={saving}
        className="mt-3 w-full rounded-xl border border-rose/40 py-3 text-sm text-rose hover:bg-rose/10 disabled:opacity-60"
      >
        Remove this tracker
      </button>

      {error && <p className="mt-2 text-xs text-rose text-center">{error}</p>}
    </>
  );
}
