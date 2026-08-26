"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const REASONS_PLACEHOLDER = "Anything on your mind today? (optional)";

export default function PledgeCard({
  userId,
  trackerId,
  substanceLabel,
  todayPledged,
  todayNote,
}: {
  userId: string;
  trackerId: string;
  substanceLabel: string;
  todayPledged: boolean;
  todayNote: string | null;
}) {
  const [pledged, setPledged] = useState(todayPledged);
  const [note, setNote] = useState(todayNote ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  async function takePledge() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("entries")
      .upsert(
        {
          user_id: userId,
          tracker_id: trackerId,
          entry_date: today,
          pledged: true,
          note: note || null,
        },
        { onConflict: "tracker_id,entry_date" }
      );
    setSaving(false);
    if (!error) {
      setPledged(true);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function saveNote() {
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("entries")
      .upsert(
        {
          user_id: userId,
          tracker_id: trackerId,
          entry_date: today,
          pledged,
          note: note || null,
        },
        { onConflict: "tracker_id,entry_date" }
      );
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  }

  return (
    <div className="glass-card rounded-2xl p-5 transition-shadow duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.32)]">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg text-paper">Today's pledge — {substanceLabel}</h2>
        {saved && <span className="text-xs text-gold">Saved</span>}
      </div>

      {pledged ? (
        <p className="mt-2 text-sm text-mist">
          You've pledged for today. Come back tomorrow to do it again.
        </p>
      ) : (
        <button
          onClick={takePledge}
          disabled={saving}
          className="mt-3 w-full rounded-xl bg-gold text-ink font-medium py-3 transition-all duration-200 hover:brightness-110 hover:shadow-[0_4px_20px_rgba(232,168,87,0.35)] active:scale-[0.98] disabled:opacity-60"
        >
          {saving ? "Saving…" : "I pledge to stay sober today"}
        </button>
      )}

      <textarea
        value={note}
        onChange={(e) => setNote(e.target.value)}
        onBlur={saveNote}
        placeholder={REASONS_PLACEHOLDER}
        rows={3}
        className="mt-4 w-full resize-none rounded-xl bg-surface2 p-3 text-sm text-paper placeholder:text-mist/60 focus:outline-none"
      />
    </div>
  );
}
