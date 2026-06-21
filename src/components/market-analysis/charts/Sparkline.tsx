interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  strokeClassName?: string;
  fillClassName?: string;
}

export function Sparkline({
  data,
  width = 120,
  height = 32,
  strokeClassName = "stroke-primary",
  fillClassName = "fill-primary/10",
}: SparklineProps) {
  const series = data.length === 0 ? [0, 0] : data.length === 1 ? [data[0], data[0]] : data;
  if (series.length < 2) return null;

  const min = Math.min(...series);
  const max = Math.max(...series);
  const range = max - min || 1;
  const padding = 2;

  const points = series.map((value, index) => {
    const x = padding + (index / (series.length - 1)) * (width - padding * 2);
    const y = height - padding - ((value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const areaPoints = `${padding},${height - padding} ${points.join(" ")} ${width - padding},${height - padding}`;

  return (
    <svg width={width} height={height} className="overflow-visible" aria-hidden>
      <polygon points={areaPoints} className={fillClassName} />
      <polyline
        points={points.join(" ")}
        fill="none"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={strokeClassName}
      />
    </svg>
  );
}
