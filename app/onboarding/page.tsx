"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const ADDICTIONS = ["Alcohol", "Nicotine", "Cannabis", "Other"];

export default function OnboardingPage() {
  const router = useRouter();
  const [addiction, setAddiction] = useState("Alcohol");
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

  async function finish() {
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

    const { error } = await supabase.from("profiles").insert({
      id: user.id,
      sober_since: new Date(soberSince).toISOString(),
      addiction: addiction.toLowerCase(),
      reasons,
    });

    setSaving(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="mx-auto max-w-sm px-6 py-16">
      <h1 className="font-display italic text-2xl text-paper">Let's set up your tracker</h1>
      <p className="mt-1 text-sm text-mist">This only takes a minute.</p>

      <div className="mt-8">
        <label className="text-xs uppercase tracking-wide text-mist">What are you tracking?</label>
        <div className="mt-2 flex flex-wrap gap-2">
          {ADDICTIONS.map((a) => (
            <button
              key={a}
              onClick={() => setAddiction(a)}
              className={`rounded-full px-4 py-2 text-sm transition-colors ${
                addiction === a ? "bg-gold text-ink" : "bg-surface text-mist"
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <label className="text-xs uppercase tracking-wide text-mist">
          When did your streak start?
        </label>
        <input
          type="datetime-local"
          value={soberSince}
          onChange={(e) => setSoberSince(e.target.value)}
          className="mt-2 w-full rounded-xl bg-surface p-3 text-sm text-paper focus:outline-none"
        />
      </div>

      <div className="mt-6">
        <label className="text-xs uppercase tracking-wide text-mist">
          Why are you doing this? (optional, add a few)
        </label>
        <div className="mt-2 flex gap-2">
          <input
            type="text"
            value={reasonDraft}
            onChange={(e) => setReasonDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addReason())}
            placeholder="e.g. Be present for my family"
            className="flex-1 rounded-xl bg-surface p-3 text-sm text-paper placeholder:text-mist/60 focus:outline-none"
          />
          <button
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
        onClick={finish}
        disabled={saving}
        className="mt-10 w-full rounded-xl bg-gold text-ink font-medium py-3 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Start tracking"}
      </button>
      {error && <p className="mt-2 text-xs text-rose text-center">{error}</p>}
    </main>
  );
}
