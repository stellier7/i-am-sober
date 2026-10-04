export function describeAuthError(error: unknown): string {
  const message = messageFrom(error);

  if (/failed to fetch|fetch failed|network|timeout|abort|dns|nxdomain/i.test(message)) {
    return "Can't reach Supabase. The project may be paused or deleted — check supabase.com and your Vercel environment variables.";
  }

  return message || "Something went wrong sending the sign-in link.";
}

function messageFrom(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error && "message" in error) {
    return String((error as { message: unknown }).message ?? "");
  }
  if (typeof error === "string") return error;
  return "";
}
