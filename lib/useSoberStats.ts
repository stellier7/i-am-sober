"use client";

import { useEffect, useState } from "react";

export const MILESTONES = [1, 7, 30, 60, 90, 180, 365];

export interface SoberStats {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  totalDays: number; // fractional, for progress math
  nextMilestone: number | null;
  daysToNextMilestone: number | null;
  progress: number; // 0..1, capped at day 90 for the dawn-arc visual
}

export function useSoberStats(soberSince: string | Date): SoberStats {
  const start = new Date(soberSince).getTime();
  const [now, setNow] = useState<number>(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const elapsedMs = Math.max(0, now - start);
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const totalDays = elapsedMs / (1000 * 60 * 60 * 24);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const nextMilestone = MILESTONES.find((m) => m > totalDays) ?? null;
  const daysToNextMilestone = nextMilestone ? Math.ceil(nextMilestone - totalDays) : null;

  const progress = Math.min(totalDays / 90, 1);

  return { days, hours, minutes, seconds, totalDays, nextMilestone, daysToNextMilestone, progress };
}
