import { formatCurrency } from "@/utils/format";

export interface MatrixBubble {
  id: string;
  label: string;
  effort: number;
  impact: number;
  size: number;
  priorityScore?: number;
}

interface BubbleMatrixProps {
  bubbles: MatrixBubble[];
  width?: number;
  height?: number;
}

function priorityColor(score = 50): string {
  if (score >= 80) return "rgba(16, 185, 129, 0.75)";
  if (score >= 60) return "rgba(59, 130, 246, 0.75)";
  if (score >= 40) return "rgba(245, 158, 11, 0.75)";
  return "rgba(148, 163, 184, 0.75)";
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function truncateLabel(label: string, max = 16): string {
  return label.length > max ? `${label.slice(0, max - 1)}…` : label;
}

export function BubbleMatrix({ bubbles, width = 720, height = 450 }: BubbleMatrixProps) {
  const pad = { top: 44, right: 44, bottom: 56, left: 64 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const maxSize = Math.max(...bubbles.map((b) => b.size), 1);
  const maxR = 26;
  const labelSpace = 18;

  const scaleR = (s: number) => 12 + (s / maxSize) * (maxR - 12);

  const plotBubble = (bubble: MatrixBubble) => {
    const r = scaleR(bubble.size);
    const plotPadX = r + 4;
    const plotPadY = r + labelSpace;
    const x = pad.left + plotPadX + (clamp(bubble.effort, 0, 100) / 100) * (innerW - plotPadX * 2);
    const y =
      pad.top +
      innerH -
      plotPadY -
      (clamp(bubble.impact, 0, 100) / 100) * (innerH - plotPadY * 2);
    const labelY = Math.min(y + r + 12, pad.top + innerH - 4);
    return { bubble, x, y, r, labelY };
  };

  const plotted = bubbles.map(plotBubble);
  const midX = pad.left + innerW / 2;
  const midY = pad.top + innerH / 2;

  return (
    <svg
      width="100%"
      viewBox={`0 0 ${width} ${height}`}
      className="min-h-[450px] w-full rounded-lg border border-border bg-white"
      role="img"
    >
      <rect x={pad.left} y={pad.top} width={innerW} height={innerH} fill="#f8fafc" rx={8} />
      <line x1={midX} y1={pad.top} x2={midX} y2={pad.top + innerH} stroke="#cbd5e1" strokeDasharray="4 3" />
      <line x1={pad.left} y1={midY} x2={pad.left + innerW} y2={midY} stroke="#cbd5e1" strokeDasharray="4 3" />
      <text x={pad.left + 10} y={pad.top + 18} fill="#059669" fontSize={10} fontWeight={600}>
        Quick wins
      </text>
      <text
        x={pad.left + innerW - 10}
        y={pad.top + 18}
        textAnchor="end"
        fill="#d97706"
        fontSize={10}
        fontWeight={600}
      >
        Strategic bets
      </text>
      <text x={pad.left + 10} y={pad.top + innerH - 8} fill="#64748b" fontSize={9}>
        Long-term plays
      </text>
      <text x={pad.left + innerW - 10} y={pad.top + innerH - 8} textAnchor="end" fill="#64748b" fontSize={9}>
        Low priority
      </text>
      {plotted.map(({ bubble, x, y, r, labelY }) => (
        <g key={bubble.id}>
          <circle
            cx={x}
            cy={y}
            r={r}
            fill={priorityColor(bubble.priorityScore)}
            stroke="#fff"
            strokeWidth={2}
          >
            <title>
              {bubble.label}
              {"\n"}Effort: {bubble.effort}
              {"\n"}Impact: {bubble.impact}
              {"\n"}Value: {formatCurrency(bubble.size)}
              {bubble.priorityScore !== undefined ? `\nPriority: ${bubble.priorityScore}` : ""}
            </title>
          </circle>
          <text x={x} y={labelY} textAnchor="middle" fill="#64748b" fontSize={9}>
            {truncateLabel(bubble.label)}
          </text>
        </g>
      ))}
      <text x={pad.left + innerW / 2} y={height - 12} textAnchor="middle" fill="#64748b" fontSize={11}>
        Implementation effort →
      </text>
      <text
        x={18}
        y={pad.top + innerH / 2}
        textAnchor="middle"
        transform={`rotate(-90 18 ${pad.top + innerH / 2})`}
        fill="#64748b"
        fontSize={11}
      >
        Revenue impact →
      </text>
    </svg>
  );
}
