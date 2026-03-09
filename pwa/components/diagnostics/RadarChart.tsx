'use client';

interface RadarChartProps {
  values: { label: string; value: number }[];
  maxValue?: number;
  size?: number;
}

export default function RadarChart({ values, maxValue = 5, size = 200 }: RadarChartProps) {
  const cx = size / 2;
  const cy = size / 2;
  const radius = size * 0.38;
  const n = values.length;

  if (n < 3) return null;

  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2; // Start from top

  function polarToCart(angle: number, r: number): [number, number] {
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  }

  // Grid rings
  const rings = [0.2, 0.4, 0.6, 0.8, 1.0];

  // Data polygon points
  const dataPoints = values.map((v, i) => {
    const angle = startAngle + i * angleStep;
    const r = (v.value / maxValue) * radius;
    return polarToCart(angle, r);
  });
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + 'Z';

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[240px] mx-auto">
      {/* Grid rings */}
      {rings.map((r) => {
        const ringPoints = Array.from({ length: n }, (_, i) => {
          const angle = startAngle + i * angleStep;
          return polarToCart(angle, radius * r);
        });
        const ringPath = ringPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0]},${p[1]}`).join(' ') + 'Z';
        return (
          <path key={r} d={ringPath} fill="none" stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth={0.5} />
        );
      })}

      {/* Axis lines */}
      {values.map((_, i) => {
        const angle = startAngle + i * angleStep;
        const [ex, ey] = polarToCart(angle, radius);
        return (
          <line key={i} x1={cx} y1={cy} x2={ex} y2={ey} stroke="currentColor" className="text-gray-200 dark:text-gray-700" strokeWidth={0.5} />
        );
      })}

      {/* Data polygon */}
      <path d={dataPath} fill="rgba(99, 102, 241, 0.15)" stroke="rgb(99, 102, 241)" strokeWidth={2} />

      {/* Data points */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={3} fill="rgb(99, 102, 241)" />
      ))}

      {/* Labels */}
      {values.map((v, i) => {
        const angle = startAngle + i * angleStep;
        const labelR = radius + 18;
        const [lx, ly] = polarToCart(angle, labelR);
        return (
          <text
            key={i}
            x={lx}
            y={ly}
            textAnchor="middle"
            dominantBaseline="middle"
            className="fill-gray-600 dark:fill-gray-400"
            fontSize={9}
            fontWeight={500}
          >
            {v.label}
          </text>
        );
      })}

      {/* Value labels on data points */}
      {dataPoints.map((p, i) => (
        <text
          key={`v${i}`}
          x={p[0]}
          y={p[1] - 8}
          textAnchor="middle"
          className="fill-indigo-600 dark:fill-indigo-400"
          fontSize={8}
          fontWeight={700}
        >
          {values[i].value.toFixed(1)}
        </text>
      ))}
    </svg>
  );
}
