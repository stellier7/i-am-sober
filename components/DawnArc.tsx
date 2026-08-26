"use client";

/**
 * The signature visual: a horizon with a sun that rises higher, and a sky
 * that warms from dusk-blue to rose to gold, the longer the streak runs.
 * `progress` is 0..1 (0 = day one, 1 = fully risen — reached around day 90).
 */
export default function DawnArc({ progress }: { progress: number }) {
  const p = Math.max(0, Math.min(1, progress));

  // Sun travels from just-below-horizon (day 1) to high in the sky (day 90+).
  const sunY = 200 - p * 150;
  const sunR = 22 + p * 10;
  const glowOpacity = 0.25 + p * 0.5;

  const skyTop = mixHex("#14171F", "#5B5F8A", Math.min(p * 2, 1));
  const skyMid = mixHex("#1E2230", "#D97A82", p);
  const skyBottom = mixHex("#262B3D", "#E8A857", p);

  return (
    <svg
      viewBox="0 0 400 220"
      className="w-full h-auto"
      role="img"
      aria-label={`Streak visual, ${Math.round(p * 100)} percent to full sunrise`}
    >
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skyTop} />
          <stop offset="55%" stopColor={skyMid} />
          <stop offset="100%" stopColor={skyBottom} />
        </linearGradient>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#E8A857" stopOpacity={glowOpacity} />
          <stop offset="100%" stopColor="#E8A857" stopOpacity="0" />
        </radialGradient>
        <clipPath id="skyClip">
          <rect x="0" y="0" width="400" height="200" rx="16" />
        </clipPath>
      </defs>

      <g clipPath="url(#skyClip)">
        <rect x="0" y="0" width="400" height="200" fill="url(#sky)" />
        <circle
          cx="200"
          cy={sunY}
          r={sunR + 40}
          fill="url(#sunGlow)"
          style={{ transition: "cy 1.2s ease-out" }}
        />
        <circle
          cx="200"
          cy={sunY}
          r={sunR}
          fill="#E8A857"
          style={{ transition: "cy 1.2s ease-out, r 1.2s ease-out" }}
        />
      </g>

      {/* horizon line, always fully drawn — the ground doesn't change, only the sky above it */}
      <rect x="0" y="196" width="400" height="4" fill="#14171F" />
    </svg>
  );
}

function mixHex(a: string, b: string, t: number): string {
  const ah = hexToRgb(a);
  const bh = hexToRgb(b);
  const r = Math.round(ah.r + (bh.r - ah.r) * t);
  const g = Math.round(ah.g + (bh.g - ah.g) * t);
  const bl = Math.round(ah.b + (bh.b - ah.b) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}
