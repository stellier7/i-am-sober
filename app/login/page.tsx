"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function sendLink(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    setSending(false);
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <main className="mx-auto max-w-sm px-6 pt-24">
      <h1 className="font-display italic text-3xl text-paper text-center">Daybreak</h1>
      <p className="mt-2 text-center text-sm text-mist">
        A private, one-day-at-a-time tracker.
      </p>

      {sent ? (
        <p className="mt-10 text-center text-sm text-paper">
          Check <span className="text-gold">{email}</span> for a sign-in link.
        </p>
      ) : (
        <form onSubmit={sendLink} className="mt-10 space-y-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full rounded-xl bg-surface p-3 text-sm text-paper placeholder:text-mist/60 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending}
            className="w-full rounded-xl bg-gold text-ink font-medium py-3 disabled:opacity-60"
          >
            {sending ? "Sending…" : "Send sign-in link"}
          </button>
          {error && <p className="text-xs text-rose text-center">{error}</p>}
        </form>
      )}
    </main>
  );
}
