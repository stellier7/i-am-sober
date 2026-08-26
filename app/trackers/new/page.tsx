"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { PREDEFINED_SUBSTANCES } from "@/lib/substances";

export default function NewTrackerPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"preset" | "custom">("preset");
  const [substance, setSubstance] = useState("alcohol");
  const [customLabel, setCustomLabel] = useState("");
  const [soberSince, setSoberSince] = useState(() =>
    new Date().toISOString().slice(0, 16)
  );
  const [reasonDraft, setReasonDraft] = useState("");
  const [reasons, setReasons] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addReason() {
    if (!reasonDraft.trim()) return;
    setReasons([...reasons, reasonDraft.trim()]);
    setReasonDraft("");
  }

  async function save() {
    if (mode === "custom" && !customLabel.trim()) {
      setError("Give your custom tracker a name.");
      return;
    }

    setSaving(true);
    setError(null);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You've been signed out — please sign in again.");
      setSaving(false);
      return;
    }

    const { error: insertError } = await supabase.from("trackers").insert({
      user_id: user.id,
      substance: mode === "custom" ? "custom" : substance,
      label: mode === "custom" ? customLabel.trim() : null,
      sober_since: new Date(soberSince).toISOString(),
      reasons,
    });

    setSaving(false);
    if (insertError) {
      setError(insertError.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <Link href="/" className="text-xs text-mist hover:text-paper">
        ← Back
      </Link>

      <h1 className="mt-6 font-display italic text-2xl text-paper">Add a tracker</h1>
      <p className="mt-1 text-sm text-mist">Track another substance with its own counter.</p>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("preset")}
          className={`flex-1 rounded-xl py-2 text-sm ${
            mode === "preset" ? "bg-gold text-ink" : "bg-surface text-mist"
          }`}
        >
          Common
        </button>
        <button
          type="button"
          onClick={() => setMode("custom")}
          className={`flex-1 rounded-xl py-2 text-sm ${
            mode === "custom" ? "bg-gold text-ink" : "bg-surface text-mist"
          }`}
        >
          Custom
        </button>
      </div>

      {mode === "preset" ? (
        <div className="mt-6 flex flex-wrap gap-2">
          {PREDEFINED_SUBSTANCES.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setSubstance(s.id)}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                substance === s.id ? "bg-gold text-ink" : "bg-surface text-mist"
              }`}
            >
              {s.emoji} {s.label}
            </button>
          ))}
        </div>
      ) : (
        <input
          type="text"
          value={customLabel}
          onChange={(e) => setCustomLabel(e.target.value)}
          placeholder="e.g. Social media, gambling…"
          className="mt-6 w-full rounded-xl bg-surface p-3 text-sm text-paper placeholder:text-mist/60 focus:outline-none"
        />
      )}

      <div className="mt-6">
        <label className="text-xs uppercase tracking-wide text-mist">Streak start</label>
        <input
          type="datetime-local"
          value={soberSince}
          onChange={(e) => setSoberSince(e.target.value)}
          className="mt-2 w-full rounded-xl bg-surface p-3 text-sm text-paper focus:outline-none"
        />
      </div>

      <div className="mt-6">
        <label className="text-xs uppercase tracking-wide text-mist">Reasons (optional)</label>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={reasonDraft}
            onChange={(e) => setReasonDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addReason())}
            placeholder="Why this one?"
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
              <li key={i} className="text-sm text-mist flex gap-2">
                <span className="text-gold">·</span>
                {r}
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
        {saving ? "Saving…" : "Add tracker"}
      </button>
      {error && <p className="mt-2 text-xs text-rose text-center">{error}</p>}
    </main>
  );
}
