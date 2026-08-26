import { MILESTONES } from "@/lib/useSoberStats";

export default function MilestoneStrip({ totalDays }: { totalDays: number }) {
  return (
    <div className="flex items-center justify-between gap-1">
      {MILESTONES.map((m) => {
        const reached = totalDays >= m;
        return (
          <div key={m} className="flex flex-col items-center gap-1.5 flex-1">
            <div
              className={`h-2.5 w-2.5 rounded-full transition-all duration-500 ${
                reached ? "bg-gold scale-110 shadow-[0_0_8px_rgba(232,168,87,0.5)]" : "bg-surface2"
              }`}
              aria-hidden
            />
            <span className={`font-mono text-[11px] ${reached ? "text-gold" : "text-mist"}`}>
              {m < 365 ? m : "1y"}
            </span>
          </div>
        );
      })}
    </div>
  );
}
