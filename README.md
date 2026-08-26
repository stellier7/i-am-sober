# Daybreak — a private sobriety tracker

Next.js + Tailwind + Supabase. Installable as a PWA. Built for one user (you) with cloud sync so your streak survives a reinstall or a new device.

## What it does
- **Dashboard** — a live day/hour/minute counter, with a "dawn arc" visual that grows from a sliver of gold on day one to a full sunrise by day 90.
- **Daily pledge** — a one-tap daily check-in, with an optional note.
- **Milestones** — 1, 7, 30, 60, 90, 180, 365 days, visualized as a strip.
- **Journal** — a running log of your daily notes.
- **Auth** — email magic-link sign-in (no password to manage), via Supabase.

## 1. Set up Supabase (free tier is plenty)
1. Go to [supabase.com](https://supabase.com) → New project.
2. Once it's created, go to **SQL Editor** → New query, paste the contents of `supabase/schema.sql`, and run it. This creates the `profiles` and `entries` tables with row-level security so only you can ever read your own data.
3. Go to **Project Settings → API** and copy the **Project URL** and **anon public key**.
4. Go to **Authentication → URL Configuration** and add your site URL (e.g. `http://localhost:3000` for now, your Vercel URL later) to the redirect allow-list.
5. (Optional but recommended for a single-user app) Go to **Authentication → Providers → Email** and consider disabling "Confirm email" for faster first sign-in, or just use the magic link as-is.

## 2. Run it locally
```bash
cp .env.local.example .env.local
# paste your Supabase URL + anon key into .env.local

npm install
npm run dev
```
Open `http://localhost:3000`, enter your email, click the magic link it sends you, then fill in your sober-since date and reasons.

## 3. Deploy to Vercel
1. Push this folder to a GitHub repo.
2. Import it in Vercel.
3. Add the two env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Vercel project settings.
4. Deploy, then add the deployed URL to Supabase's redirect allow-list (same place as step 1.4).

## 4. Install it as an app on your phone/iPad
Open the deployed URL in Safari/Chrome → Share → **Add to Home Screen**. It'll launch full-screen with no browser chrome, like a native app.

## Notes / things you might want to change
- **App icons**: `public/manifest.json` points to `public/icons/icon-192.png` and `icon-512.png`, which aren't included — drop your own PNGs in there (or ask me to generate placeholders).
- **Milestones**: edit the `MILESTONES` array in `lib/useSoberStats.ts`.
- **Multiple addictions at once**: the schema tracks one `sober_since` per user. If you want to track more than one thing simultaneously, `profiles` would need to become a list rather than a single row — happy to extend it if you want that.
- **Streak reset**: there's currently no "I slipped, reset my counter" flow — just update `sober_since` in the `profiles` table (or I can add a settings page for this).
