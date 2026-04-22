interface Props {
  score: number;
  size?: number;
}

export default function RiskGauge({ score, size = 160 }: Props) {
  const r = (size / 2) * 0.75;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = Math.PI * r;
  const filled = (score / 100) * circumference;

  const color =
    score >= 75 ? '#ef4444' :
    score >= 55 ? '#f97316' :
    score >= 30 ? '#f59e0b' :
    '#10b981';

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width={size} height={size * 0.6} viewBox={`0 0 ${size} ${size * 0.6}`}>
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={size * 0.08}
          strokeLinecap="round"
        />
        <path
          d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.08}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${circumference}`}
          className="transition-all duration-1000 ease-out"
        />
        <text x={cx} y={cy - 4} textAnchor="middle" className="font-bold" style={{ fontSize: size * 0.18, fill: color, fontWeight: 700 }}>
          {score.toFixed(0)}
        </text>
        <text x={cx} y={cy + size * 0.08} textAnchor="middle" style={{ fontSize: size * 0.09, fill: '#64748b' }}>
          Risk Score
        </text>
      </svg>
    </div>
  );
}
