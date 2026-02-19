import React from "react";

export type SparklineProps = {
  values: number[];
  labels: string[];
  width?: number;
  height?: number;
  className?: string;
};

export function Sparkline({ values, labels, width = 120, height = 28, className }: SparklineProps) {
  const [hoverIndex, setHoverIndex] = React.useState<number | null>(null);
  const max = Math.max(1, ...values);
  const points = values
    .map((v, i) => {
      const x = values.length === 1 ? width / 2 : (i / (values.length - 1)) * width;
      const y = height - (v / max) * height;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");
  const activeIndex = hoverIndex ?? values.length - 1;
  const activeValue = values[activeIndex] ?? 0;
  const activeLabel = labels[activeIndex] ?? "";

  return (
    <div className={className ?? "sparkline-wrap"}>
      <svg
        className="sparkline-svg"
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden="true"
        onMouseMove={(e) => {
          const rect = (e.currentTarget as SVGSVGElement).getBoundingClientRect();
          const x = Math.max(0, Math.min(width, e.clientX - rect.left));
          const idx = values.length <= 1 ? 0 : Math.round((x / width) * (values.length - 1));
          setHoverIndex(idx);
        }}
        onMouseLeave={() => setHoverIndex(null)}
      >
        <polyline points={points} />
        {values.map((v, i) => {
          const x = values.length === 1 ? width / 2 : (i / (values.length - 1)) * width;
          const y = height - (v / max) * height;
          return <circle key={i} cx={x} cy={y} r={i === activeIndex ? 2.6 : 1.6} />;
        })}
      </svg>
      <div className="sparkline-tooltip">
        <span>{activeLabel}</span>
        <strong>{activeValue}</strong>
      </div>
    </div>
  );
}
