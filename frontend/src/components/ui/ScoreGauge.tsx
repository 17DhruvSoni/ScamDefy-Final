import React from 'react';

interface Props { score: number; size?: number; }

export function ScoreGauge({ score, size = 120 }: Props) {
  const pct = Math.min(100, Math.max(0, score));
  const r = (size - 16) / 2;
  const circumference = 2 * Math.PI * r;
  const dashOffset = circumference - (pct / 100) * circumference;
  const color = score >= 80 ? '#ef4444' : score >= 60 ? '#f97316' : score >= 30 ? '#f59e0b' : '#00f2ff';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Track */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"
      />
      {/* Progress */}
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s' }}
        filter={`drop-shadow(0 0 6px ${color})`}
      />
      {/* Score text */}
      <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle"
        fill={color} fontSize={size * 0.22} fontWeight="900" fontFamily="Space Grotesk, sans-serif">
        {Math.round(score)}
      </text>
    </svg>
  );
}
