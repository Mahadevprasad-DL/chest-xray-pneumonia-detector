interface Props {
  data: number[][];
  width?: number;
  height?: number;
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function heatColor(v: number): string {
  const stops = [
    { t: 0, r: 0, g: 0, b: 255 },
    { t: 0.25, r: 0, g: 255, b: 255 },
    { t: 0.5, r: 0, g: 255, b: 0 },
    { t: 0.75, r: 255, g: 255, b: 0 },
    { t: 1, r: 255, g: 0, b: 0 },
  ];
  let i = 0;
  while (i < stops.length - 2 && stops[i + 1].t < v) i++;
  const a = stops[i], b = stops[i + 1];
  const t = (v - a.t) / (b.t - a.t);
  return `rgba(${Math.round(lerp(a.r, b.r, t))},${Math.round(lerp(a.g, b.g, t))},${Math.round(lerp(a.b, b.b, t))},0.6)`;
}

export default function HeatmapOverlay({ data, width = 280, height = 280 }: Props) {
  const rows = data.length;
  const cols = data[0]?.length ?? 0;
  const cellW = width / cols;
  const cellH = height / rows;

  return (
    <div className="relative inline-block rounded-lg overflow-hidden" style={{ width, height }}>
      <div
        className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900"
        style={{ backgroundImage: 'radial-gradient(ellipse 60% 70% at 50% 40%, #cbd5e1 0%, #64748b 40%, #1e293b 100%)' }}
      />
      <svg
        className="absolute inset-0"
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
      >
        {data.map((row, r) =>
          row.map((val, c) => (
            <rect
              key={`${r}-${c}`}
              x={c * cellW}
              y={r * cellH}
              width={cellW + 1}
              height={cellH + 1}
              fill={heatColor(val)}
            />
          ))
        )}
      </svg>
      <div className="absolute bottom-2 right-2 bg-black/50 rounded px-2 py-1 text-white text-xs font-medium">
        Grad-CAM
      </div>
    </div>
  );
}
