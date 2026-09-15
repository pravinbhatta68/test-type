import type { TestRecord } from "./typing-analytics";

type ProgressChartProps = {
  history: TestRecord[];
};

const width = 720;
const height = 250;
const padding = { top: 24, right: 24, bottom: 42, left: 44 };

function pointsFor(
  values: number[],
  maximum: number,
  chartWidth: number,
  chartHeight: number,
) {
  return values
    .map((value, index) => {
      const x =
        padding.left +
        (values.length === 1 ? chartWidth / 2 : (index / (values.length - 1)) * chartWidth);
      const y = padding.top + chartHeight - (value / maximum) * chartHeight;
      return `${x},${y}`;
    })
    .join(" ");
}

export default function ProgressChart({ history }: ProgressChartProps) {
  if (history.length === 0) {
    return (
      <div className="chart-empty">
        Complete a test to begin your performance graph.
      </div>
    );
  }

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const maximumWpm = Math.max(
    40,
    Math.ceil(Math.max(...history.map((record) => record.wpm)) / 10) * 10,
  );
  const wpmPoints = pointsFor(
    history.map((record) => record.wpm),
    maximumWpm,
    chartWidth,
    chartHeight,
  );
  const accuracyPoints = pointsFor(
    history.map((record) => record.accuracy),
    100,
    chartWidth,
    chartHeight,
  );

  return (
    <div className="progress-chart-wrap">
      <div className="chart-legend" aria-hidden="true">
        <span><i className="legend-wpm" /> WPM</span>
        <span><i className="legend-accuracy" /> Accuracy</span>
      </div>
      <svg
        className="progress-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={`Recent performance across ${history.length} completed tests`}
      >
        {[0, 0.5, 1].map((ratio) => {
          const y = padding.top + chartHeight * ratio;
          return (
            <line
              key={ratio}
              className="chart-grid-line"
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
            />
          );
        })}
        <polyline className="chart-line chart-line-wpm" points={wpmPoints} />
        <polyline
          className="chart-line chart-line-accuracy"
          points={accuracyPoints}
        />
        {history.map((record, index) => {
          const x =
            padding.left +
            (history.length === 1
              ? chartWidth / 2
              : (index / (history.length - 1)) * chartWidth);
          const wpmY =
            padding.top + chartHeight - (record.wpm / maximumWpm) * chartHeight;
          const accuracyY =
            padding.top + chartHeight - (record.accuracy / 100) * chartHeight;
          return (
            <g key={record.id}>
              <circle className="chart-dot chart-dot-wpm" cx={x} cy={wpmY} r="5" />
              <circle
                className="chart-dot chart-dot-accuracy"
                cx={x}
                cy={accuracyY}
                r="5"
              />
              <text className="chart-label" x={x} y={height - 14} textAnchor="middle">
                {index + 1}
              </text>
              <title>
                {`Test ${index + 1}: ${record.wpm} WPM, ${record.accuracy}% accuracy`}
              </title>
            </g>
          );
        })}
        <text className="chart-axis-label" x="8" y="18">WPM</text>
        <text className="chart-axis-label" x={width - 74} y="18">Accuracy %</text>
      </svg>
    </div>
  );
}
