import { QUOTES, type Quote } from "./quotes";

function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Same quote all day for a given tracker; different trackers get different quotes. */
export function getDailyQuote(trackerId: string, date = new Date()): Quote {
  const dayKey = date.toISOString().slice(0, 10);
  const index = hashString(`${trackerId}:${dayKey}`) % QUOTES.length;
  return QUOTES[index];
}

/** Pick another quote (e.g. when user taps "Another"). */
export function getNextQuote(trackerId: string, seed: number): Quote {
  const index = (hashString(trackerId) + seed) % QUOTES.length;
  return QUOTES[index];
}
