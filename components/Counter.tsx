import type { SoberStats } from "@/lib/useSoberStats";

export default function Counter({ stats }: { stats: SoberStats }) {
  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div className="text-center">
      <div className="font-mono tabular text-6xl sm:text-7xl font-medium text-paper leading-none">
        {stats.days}
      </div>
      <div className="mt-1 font-body text-sm tracking-wide text-mist uppercase">
        {stats.days === 1 ? "day sober" : "days sober"}
      </div>
      <div className="mt-4 font-mono tabular text-lg text-mist">
        {pad(stats.hours)}:{pad(stats.minutes)}:{pad(stats.seconds)}
      </div>
    </div>
  );
}
