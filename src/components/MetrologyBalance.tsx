import React from 'react';
import { ArrowLeftRight, ExternalLink } from 'lucide-react';
import {
  DECISIONS,
  DecisionItem,
  METRICS,
  MetricKey,
  SOURCES,
  formatMetricValue,
  formatNumberPL,
  formatRatio,
} from '../data/evidence';

interface MetrologyBalanceProps {
  leftItem: DecisionItem;
  rightItem: DecisionItem;
  activeMetric: MetricKey;
  onSelectLeft: (id: string) => void;
  onSelectRight: (id: string) => void;
  onSwap: () => void;
  onInspectSource: (sourceId: string) => void;
}

function getSecondarySummary(item: DecisionItem, activeMetric: MetricKey): string {
  const parts: string[] = [];
  if (activeMetric !== 'co2') {
    parts.push(`${formatNumberPL(item.metrics.co2)} kg CO₂e`);
  }
  if (activeMetric !== 'water') {
    parts.push(`${formatNumberPL(item.metrics.water)} L wody`);
  }
  if (activeMetric !== 'land') {
    parts.push(`${formatNumberPL(item.metrics.land)} m² gleby`);
  }
  if (activeMetric !== 'energy' && parts.length < 2) {
    parts.push(`${formatNumberPL(item.metrics.energy)} kWh`);
  }
  return parts.slice(0, 2).join(' · ');
}

export const MetrologyBalance: React.FC<MetrologyBalanceProps> = ({
  leftItem,
  rightItem,
  activeMetric,
  onSelectLeft,
  onSelectRight,
  onSwap,
  onInspectSource,
}) => {
  const leftVal = leftItem.metrics[activeMetric];
  const rightVal = rightItem.metrics[activeMetric];
  const ratio = formatRatio(leftVal, rightVal);

  // Physically honest log-scaled tilt clamped cleanly so both pans stay inside viewBox
  const logDiff = Math.log10(Math.max(rightVal, 1e-6) / Math.max(leftVal, 1e-6));
  const angleDeg = Math.max(-13.5, Math.min(13.5, logDiff * 8.6));
  const angleRad = (angleDeg * Math.PI) / 180;

  const cx = 590;
  const cy = 156;
  const armLength = 382;

  const leftHookX = cx - armLength * Math.cos(angleRad);
  const leftHookY = cy - armLength * Math.sin(angleRad);
  const rightHookX = cx + armLength * Math.cos(angleRad);
  const rightHookY = cy + armLength * Math.sin(angleRad);

  const needleDeg = Math.max(-46, Math.min(46, angleDeg * 2.9));

  const leftSource = SOURCES[leftItem.primarySourceId];
  const rightSource = SOURCES[rightItem.primarySourceId];

  // Generate vernier dial ticks around the circular scale (-125deg to +125deg)
  const dialTicks = Array.from({ length: 51 }, (_, i) => {
    const deg = -125 + i * 5;
    const rad = ((deg - 90) * Math.PI) / 180;
    const isMajor = i % 5 === 0;
    const rOuter = 71;
    const rInner = isMajor ? 58 : 64;
    return {
      x1: cx + rInner * Math.cos(rad),
      y1: cy + rInner * Math.sin(rad),
      x2: cx + rOuter * Math.cos(rad),
      y2: cy + rOuter * Math.sin(rad),
      isMajor,
    };
  });

  const panW = 288;
  const panH = 160;
  const panDrop = 50;

  return (
    <div className="balance-canvas-wrap">
      {/* Desktop Interactive Metrology Balance SVG */}
      <svg
        className="balance-svg"
        viewBox="0 0 1180 482"
        role="img"
        aria-label={`Waga metrologiczna porównująca ${leftItem.name} (${formatMetricValue(
          leftVal,
          activeMetric,
        )}) oraz ${rightItem.name} (${formatMetricValue(
          rightVal,
          activeMetric,
        )}), stosunek ${ratio.label}`}
      >
        {/* Subtle calibration baseline behind the fulcrum */}
        <line
          x1="120"
          y1={cy}
          x2="1060"
          y2={cy}
          stroke="rgba(20, 22, 21, 0.09)"
          strokeWidth="1"
          strokeDasharray="4 6"
        />

        {/* Tilting Precision Beam */}
        <g
          className="balance-beam-group"
          style={{ transform: `rotate(${angleDeg}deg)` }}
        >
          {/* Main machined hollow beam bar */}
          <rect
            x={cx - armLength - 12}
            y={cy - 7}
            width={(armLength + 12) * 2}
            height="14"
            rx="1.5"
            fill="#F4F2EC"
            stroke="#141615"
            strokeWidth="1.6"
          />
          {/* Left end-cap hook */}
          <path
            d={`M ${cx - armLength} ${cy + 7} L ${cx - armLength} ${cy + 18} C ${
              cx - armLength
            } ${cy + 25}, ${cx - armLength + 9} ${cy + 25}, ${cx - armLength + 9} ${
              cy + 19
            }`}
            fill="none"
            stroke="#141615"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
          {/* Right end-cap hook */}
          <path
            d={`M ${cx + armLength} ${cy + 7} L ${cx + armLength} ${cy + 18} C ${
              cx + armLength
            } ${cy + 25}, ${cx + armLength - 9} ${cy + 25}, ${cx + armLength - 9} ${
              cy + 19
            }`}
            fill="none"
            stroke="#141615"
            strokeWidth="1.6"
            strokeLinecap="round"
          />
        </g>

        {/* Left Gravity-Leveled Pan */}
        <g
          className="balance-pan-group"
          style={{ transform: `translate(${leftHookX}px, ${leftHookY}px)` }}
        >
          {/* Triangulated suspension wires */}
          <line
            x1="0"
            y1="20"
            x2={-panW * 0.34}
            y2={panDrop + 4}
            stroke="#141615"
            strokeWidth="1.35"
          />
          <line
            x1="0"
            y1="20"
            x2={panW * 0.34}
            y2={panDrop + 4}
            stroke="#141615"
            strokeWidth="1.35"
          />
          {/* Pan dish underneath */}
          <path
            d={`M ${-panW / 2 - 10} ${panDrop + panH - 2} Q 0 ${panDrop + panH + 16} ${
              panW / 2 + 10
            } ${panDrop + panH - 2} Z`}
            fill={ratio.heavier === 'left' ? '#141615' : '#ECEAE3'}
            stroke="#141615"
            strokeWidth="1.5"
          />
          {/* Interactive Pan Card */}
          <foreignObject
            x={-panW / 2}
            y={panDrop}
            width={panW}
            height={panH}
          >
            <div
              className={`pan-foreign-card ${
                ratio.heavier === 'left' ? 'heavier' : ''
              }`}
            >
              <div className="pan-selector-row">
                <select
                  aria-label="Wybierz decyzję na lewej szalce"
                  className="pan-select"
                  value={leftItem.id}
                  onChange={(e) => onSelectLeft(e.target.value)}
                >
                  {DECISIONS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pan-primary-value tabular">
                {formatMetricValue(leftVal, activeMetric)}
              </div>
              <div className="pan-secondary-metrics tabular">
                {getSecondarySummary(leftItem, activeMetric)}
              </div>
              <a
                href={leftSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="source-pill"
                onClick={(e) => {
                  if (e.altKey) {
                    e.preventDefault();
                    onInspectSource(leftSource.id);
                  }
                }}
                title={`${leftSource.citation} (kliknij, aby otworzyć źródło)`}
              >
                <span>{leftSource.shortBadge}</span>
                <ExternalLink size={11} strokeWidth={2} />
              </a>
            </div>
          </foreignObject>
        </g>

        {/* Right Gravity-Leveled Pan */}
        <g
          className="balance-pan-group"
          style={{ transform: `translate(${rightHookX}px, ${rightHookY}px)` }}
        >
          {/* Triangulated suspension wires */}
          <line
            x1="0"
            y1="20"
            x2={-panW * 0.34}
            y2={panDrop + 4}
            stroke="#141615"
            strokeWidth="1.35"
          />
          <line
            x1="0"
            y1="20"
            x2={panW * 0.34}
            y2={panDrop + 4}
            stroke="#141615"
            strokeWidth="1.35"
          />
          {/* Heavy graphite dish */}
          <path
            d={`M ${-panW / 2 - 10} ${panDrop + panH - 2} Q 0 ${panDrop + panH + 16} ${
              panW / 2 + 10
            } ${panDrop + panH - 2} Z`}
            fill={ratio.heavier === 'right' ? '#141615' : '#ECEAE3'}
            stroke="#141615"
            strokeWidth="1.5"
          />
          {/* Interactive Pan Card */}
          <foreignObject
            x={-panW / 2}
            y={panDrop}
            width={panW}
            height={panH}
          >
            <div
              className={`pan-foreign-card ${
                ratio.heavier === 'right' ? 'heavier' : ''
              }`}
            >
              <div className="pan-selector-row">
                <select
                  aria-label="Wybierz decyzję na prawej szalce"
                  className="pan-select"
                  value={rightItem.id}
                  onChange={(e) => onSelectRight(e.target.value)}
                >
                  {DECISIONS.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="pan-primary-value tabular">
                {formatMetricValue(rightVal, activeMetric)}
              </div>
              <div className="pan-secondary-metrics tabular">
                {getSecondarySummary(rightItem, activeMetric)}
              </div>
              <a
                href={rightSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="source-pill"
                title={`${rightSource.citation} (kliknij, aby otworzyć źródło)`}
              >
                <span>{rightSource.shortBadge}</span>
                <ExternalLink size={11} strokeWidth={2} />
              </a>
            </div>
          </foreignObject>
        </g>

        {/* Center Calibrated Vernier Fulcrum Dial */}
        <g>
          <circle
            cx={cx}
            cy={cy}
            r="76"
            fill="#F4F2EC"
            stroke="#141615"
            strokeWidth="1.8"
          />
          <circle
            cx={cx}
            cy={cy}
            r="71"
            fill="none"
            stroke="rgba(20, 22, 21, 0.25)"
            strokeWidth="0.75"
          />
          {dialTicks.map((t, idx) => (
            <line
              key={idx}
              x1={t.x1}
              y1={t.y1}
              x2={t.x2}
              y2={t.y2}
              stroke="#141615"
              strokeWidth={t.isMajor ? '1.35' : '0.8'}
            />
          ))}

          {/* Copper Fulcrum Needle */}
          <g
            className="balance-needle-group"
            style={{ transform: `rotate(${needleDeg}deg)` }}
          >
            <polygon
              points={`${cx - 3.2},${cy} ${cx},${cy - 60} ${cx + 3.2},${cy}`}
              fill="#A44B27"
            />
            <circle
              cx={cx}
              cy={cy}
              r="11"
              fill="#F4F2EC"
              stroke="#A44B27"
              strokeWidth="2.5"
            />
            <circle cx={cx} cy={cy} r="4.5" fill="#141615" />
          </g>

          {/* Center Ratio Readout */}
          <text
            x={cx}
            y={cy + 30}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="11.5"
            fontWeight="500"
            letterSpacing="0.06em"
            fill="#3F4441"
          >
            STOSUNEK
          </text>
          <text
            x={cx}
            y={cy + 50}
            textAnchor="middle"
            fontFamily="Archivo, sans-serif"
            fontSize="17"
            fontWeight="800"
            fill="#141615"
          >
            {ratio.label}
          </text>
        </g>
      </svg>

      {/* Mobile Compact Metrology Stack */}
      <div className="mobile-balance-cards">
        <div
          className={`pan-foreign-card ${
            ratio.heavier === 'left' ? 'heavier' : ''
          }`}
        >
          <select
            aria-label="Wybierz decyzję A"
            className="pan-select"
            value={leftItem.id}
            onChange={(e) => onSelectLeft(e.target.value)}
          >
            {DECISIONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <div className="pan-primary-value tabular">
            {formatMetricValue(leftVal, activeMetric)}
          </div>
          <div className="pan-secondary-metrics tabular">
            {getSecondarySummary(leftItem, activeMetric)}
          </div>
          <a
            href={leftSource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="source-pill"
            style={{ marginTop: 8 }}
          >
            <span>{leftSource.shortBadge}</span>
            <ExternalLink size={11} />
          </a>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 14px',
            border: '1.5px solid var(--rule)',
            borderRadius: 6,
            background: 'var(--bg-card)',
          }}
        >
          <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--ink-muted)' }}>
            STOSUNEK ({METRICS[activeMetric].shortLabel})
          </span>
          <strong className="tabular" style={{ fontSize: '1.05rem', color: 'var(--copper)' }}>
            {ratio.label}
          </strong>
          <button
            type="button"
            className="swap-inline-btn"
            onClick={onSwap}
            aria-label="Zamień szalki miejscami"
          >
            <ArrowLeftRight size={13} />
          </button>
        </div>

        <div
          className={`pan-foreign-card ${
            ratio.heavier === 'right' ? 'heavier' : ''
          }`}
        >
          <select
            aria-label="Wybierz decyzję B"
            className="pan-select"
            value={rightItem.id}
            onChange={(e) => onSelectRight(e.target.value)}
          >
            {DECISIONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          <div className="pan-primary-value tabular">
            {formatMetricValue(rightVal, activeMetric)}
          </div>
          <div className="pan-secondary-metrics tabular">
            {getSecondarySummary(rightItem, activeMetric)}
          </div>
          <a
            href={rightSource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="source-pill"
            style={{ marginTop: 8 }}
          >
            <span>{rightSource.shortBadge}</span>
            <ExternalLink size={11} />
          </a>
        </div>
      </div>
    </div>
  );
};
