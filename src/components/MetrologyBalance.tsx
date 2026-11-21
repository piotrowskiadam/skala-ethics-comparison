import React, { useMemo } from 'react';
import { ArrowLeftRight, ExternalLink, Scale } from 'lucide-react';
import {
  CATEGORY_LABELS,
  DECISIONS,
  DecisionCategory,
  DecisionItem,
  METRICS,
  MetricKey,
  SOURCES,
  formatMetricValue,
  formatNumberPL,
  formatRatio,
} from '../data/evidence';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

interface MetrologyBalanceProps {
  leftItem: DecisionItem;
  rightItem: DecisionItem;
  activeMetric: MetricKey;
  isCounterbalanced: boolean;
  onToggleCounterbalance: () => void;
  onSelectLeft: (id: string) => void;
  onSelectRight: (id: string) => void;
  onSwap: () => void;
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as DecisionCategory[];

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

function formatMultiplier(factor: number): string {
  if (factor >= 100) return Math.round(factor).toLocaleString('pl-PL');
  if (factor >= 10) {
    return factor.toLocaleString('pl-PL', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
  }
  return factor.toLocaleString('pl-PL', {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
}

export const MetrologyBalance: React.FC<MetrologyBalanceProps> = ({
  leftItem,
  rightItem,
  activeMetric,
  isCounterbalanced,
  onToggleCounterbalance,
  onSelectLeft,
  onSelectRight,
  onSwap,
}) => {
  const rawLeftVal = leftItem.metrics[activeMetric];
  const rawRightVal = rightItem.metrics[activeMetric];
  const ratio = formatRatio(rawLeftVal, rawRightVal);

  const isSame = ratio.heavier === 'equal';
  const counterActive = isCounterbalanced && !isSame;

  const leftMultiplier = counterActive && ratio.heavier === 'right' ? ratio.factor : 1;
  const rightMultiplier = counterActive && ratio.heavier === 'left' ? ratio.factor : 1;

  const effectiveLeftVal = rawLeftVal * leftMultiplier;
  const effectiveRightVal = rawRightVal * rightMultiplier;

  // Smoothly animated odometer numerals
  const animLeftVal = useAnimatedNumber(effectiveLeftVal, 420);
  const animRightVal = useAnimatedNumber(effectiveRightVal, 420);
  const animFactor = useAnimatedNumber(counterActive ? 1 : ratio.factor, 420);

  // True 4-decade logarithmic mapping (1x -> 0deg, 10x -> 27.5deg, 100x -> 55deg, 1000x -> 82.5deg, 10000x -> 110deg)
  const signedLog = counterActive
    ? 0
    : Math.log10(Math.max(rawRightVal, 1e-6) / Math.max(rawLeftVal, 1e-6));

  // Beam tilts cleanly across 4 decades up to ±14.5deg
  const angleDeg = Math.max(-14.5, Math.min(14.5, (signedLog / 4) * 14.5));
  const angleRad = (angleDeg * Math.PI) / 180;

  // Needle sweeps the full calibrated ±110deg logarithmic dial (27.5deg per order of magnitude)
  const needleDeg = Math.max(-110, Math.min(110, signedLog * 27.5));

  const cx = 590;
  const cy = 158;
  const armLength = 382;

  const leftHookX = cx - armLength * Math.cos(angleRad);
  const leftHookY = cy - armLength * Math.sin(angleRad);
  const rightHookX = cx + armLength * Math.cos(angleRad);
  const rightHookY = cy + armLength * Math.sin(angleRad);

  const leftSource = SOURCES[leftItem.primarySourceId];
  const rightSource = SOURCES[rightItem.primarySourceId];

  // Grouped options for <optgroup>
  const groupedDecisions = useMemo(
    () =>
      CATEGORIES.map((cat) => ({
        category: cat,
        label: CATEGORY_LABELS[cat],
        items: DECISIONS.filter((d) => d.category === cat),
      })),
    [],
  );

  // Calibrated logarithmic dial ticks (-110deg to +110deg, 1x / 10x / 100x / 1k / 10k)
  const dialTicks = useMemo(() => {
    const ticks: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      isMajor: boolean;
      label?: string;
      lx?: number;
      ly?: number;
    }[] = [];

    const decadeLabels: Record<number, string> = {
      '-4': '10k',
      '-3': '1k',
      '-2': '100×',
      '-1': '10×',
      '0': '1×',
      '1': '10×',
      '2': '100×',
      '3': '1k',
      '4': '10k',
    };

    for (let step = -40; step <= 40; step += 2) {
      const decade = step / 10;
      const deg = decade * 27.5;
      const rad = ((deg - 90) * Math.PI) / 180;
      const isMajor = step % 10 === 0;
      const rOuter = 75;
      const rInner = isMajor ? 61 : 68;
      const rLabel = 50;

      ticks.push({
        x1: cx + rInner * Math.cos(rad),
        y1: cy + rInner * Math.sin(rad),
        x2: cx + rOuter * Math.cos(rad),
        y2: cy + rOuter * Math.sin(rad),
        isMajor,
        label: isMajor ? decadeLabels[decade] : undefined,
        lx: isMajor ? cx + rLabel * Math.cos(rad) : undefined,
        ly: isMajor ? cy + rLabel * Math.sin(rad) : undefined,
      });
    }
    return ticks;
  }, [cx, cy]);

  const mobileDialTicks = useMemo(() => {
    const ticks: { x1: number; y1: number; x2: number; y2: number; isMajor: boolean }[] = [];
    for (let step = -4; step <= 4; step += 0.5) {
      const deg = step * 27.5;
      const rad = ((deg - 90) * Math.PI) / 180;
      const isMajor = Number.isInteger(step);
      const rOut = 37;
      const rIn = isMajor ? 29 : 33;
      ticks.push({
        x1: 180 + rIn * Math.cos(rad),
        y1: 62 + rIn * Math.sin(rad),
        x2: 180 + rOut * Math.cos(rad),
        y2: 62 + rOut * Math.sin(rad),
        isMajor,
      });
    }
    return ticks;
  }, []);

  const panW = 290;
  const panH = 166;
  const panDrop = 50;

  const animatedRatioLabel = useMemo(() => {
    if (counterActive) return '1 : 1,0';
    if (isSame) return '1 : 1,0';
    const f = formatMultiplier(animFactor);
    return ratio.heavier === 'right' ? `1 : ${f}` : `${f} : 1`;
  }, [animFactor, counterActive, isSame, ratio.heavier]);

  const lighterItem = ratio.heavier === 'left' ? rightItem : leftItem;
  const heavierItem = ratio.heavier === 'left' ? leftItem : rightItem;

  const mobileLeftShare = Math.max(
    0.04,
    effectiveLeftVal / Math.max(effectiveLeftVal + effectiveRightVal, 1e-6),
  );
  const mobileRightShare = Math.max(
    0.04,
    effectiveRightVal / Math.max(effectiveLeftVal + effectiveRightVal, 1e-6),
  );

  const renderGroupedOptions = (useShortLabel: boolean) =>
    groupedDecisions.map((group) => (
      <optgroup key={group.category} label={group.label}>
        {group.items.map((item) => (
          <option key={item.id} value={item.id}>
            {useShortLabel ? item.shortLabel : item.name}
          </option>
        ))}
      </optgroup>
    ));

  return (
    <div className="balance-canvas-wrap">
      {/* Live Hero Ratio & Counterweight Readout Strip */}
      <div className="hero-ratio-strip" aria-live="polite" aria-atomic="true">
        <div className="hero-ratio-readout">
          <span className="mono hero-ratio-label">
            {counterActive
              ? 'RÓWNOWAGA SZALEK'
              : isSame
              ? 'IDENTYCZNE OBCIĄŻENIE'
              : `STOSUNEK (${METRICS[activeMetric].shortLabel})`}
          </span>
          <strong className="hero-ratio-number tabular">
            {counterActive
              ? `${formatMultiplier(ratio.factor)}× ${lighterItem.shortLabel} = 1× ${heavierItem.shortLabel}`
              : animatedRatioLabel}
          </strong>
        </div>

        {!isSame && (
          <button
            type="button"
            className={`counterbalance-btn ${counterActive ? 'active' : ''}`}
            aria-pressed={counterActive}
            onClick={onToggleCounterbalance}
          >
            <Scale size={14} strokeWidth={2} aria-hidden="true" />
            <span>
              {counterActive
                ? 'Zdejmij odważniki (1 vs 1)'
                : `Wyrównaj wagę (×${formatMultiplier(ratio.factor)})`}
            </span>
          </button>
        )}
      </div>

      {/* Desktop Interactive Metrology Balance SVG (role="group" preserves interactive descendants for a11y) */}
      <svg
        className="balance-svg"
        viewBox="0 0 1180 486"
        role="group"
        aria-label={`Waga metrologiczna porównująca ${leftItem.name} oraz ${rightItem.name}`}
      >
        {/* Subtle horizontal calibration baseline */}
        <line
          x1="120"
          y1={cy}
          x2="1060"
          y2={cy}
          stroke="rgba(20, 22, 21, 0.1)"
          strokeWidth="1"
          strokeDasharray="4 6"
        />

        {/* Tilting Precision Beam */}
        <g
          className="balance-beam-group"
          style={{ transform: `rotate(${angleDeg}deg)` }}
        >
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
          <path
            d={`M ${-panW / 2 - 10} ${panDrop + panH - 2} Q 0 ${panDrop + panH + 16} ${
              panW / 2 + 10
            } ${panDrop + panH - 2} Z`}
            fill={!counterActive && ratio.heavier === 'left' ? '#141615' : '#ECEAE3'}
            stroke="#141615"
            strokeWidth="1.5"
          />
          <foreignObject x={-panW / 2} y={panDrop} width={panW} height={panH}>
            <div
              className={`pan-foreign-card ${
                !counterActive && ratio.heavier === 'left' ? 'heavier' : ''
              } ${counterActive && leftMultiplier > 1 ? 'counterweighted' : ''}`}
            >
              <div className="pan-selector-row">
                {leftMultiplier > 1 && (
                  <span className="multiplier-badge mono">
                    ×{formatMultiplier(leftMultiplier)}
                  </span>
                )}
                <select
                  aria-label="Wybierz decyzję na lewej szalce"
                  className="pan-select"
                  value={leftItem.id}
                  onChange={(e) => onSelectLeft(e.target.value)}
                >
                  {renderGroupedOptions(false)}
                </select>
              </div>
              <div className="pan-primary-value tabular">
                {formatMetricValue(animLeftVal, activeMetric)}
              </div>
              <div className="pan-secondary-metrics tabular">
                {leftMultiplier > 1
                  ? `1 szt.: ${formatMetricValue(rawLeftVal, activeMetric)}`
                  : getSecondarySummary(leftItem, activeMetric)}
              </div>
              <a
                href={leftSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="source-pill"
                aria-label={`${leftSource.shortBadge} — otwórz publikację w nowej karcie`}
                title={leftSource.citation}
              >
                <span>{leftSource.shortBadge}</span>
                <ExternalLink size={11} strokeWidth={2} aria-hidden="true" />
              </a>
            </div>
          </foreignObject>
        </g>

        {/* Right Gravity-Leveled Pan */}
        <g
          className="balance-pan-group"
          style={{ transform: `translate(${rightHookX}px, ${rightHookY}px)` }}
        >
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
          <path
            d={`M ${-panW / 2 - 10} ${panDrop + panH - 2} Q 0 ${panDrop + panH + 16} ${
              panW / 2 + 10
            } ${panDrop + panH - 2} Z`}
            fill={!counterActive && ratio.heavier === 'right' ? '#141615' : '#ECEAE3'}
            stroke="#141615"
            strokeWidth="1.5"
          />
          <foreignObject x={-panW / 2} y={panDrop} width={panW} height={panH}>
            <div
              className={`pan-foreign-card ${
                !counterActive && ratio.heavier === 'right' ? 'heavier' : ''
              } ${counterActive && rightMultiplier > 1 ? 'counterweighted' : ''}`}
            >
              <div className="pan-selector-row">
                {rightMultiplier > 1 && (
                  <span className="multiplier-badge mono">
                    ×{formatMultiplier(rightMultiplier)}
                  </span>
                )}
                <select
                  aria-label="Wybierz decyzję na prawej szalce"
                  className="pan-select"
                  value={rightItem.id}
                  onChange={(e) => onSelectRight(e.target.value)}
                >
                  {renderGroupedOptions(false)}
                </select>
              </div>
              <div className="pan-primary-value tabular">
                {formatMetricValue(animRightVal, activeMetric)}
              </div>
              <div className="pan-secondary-metrics tabular">
                {rightMultiplier > 1
                  ? `1 szt.: ${formatMetricValue(rawRightVal, activeMetric)}`
                  : getSecondarySummary(rightItem, activeMetric)}
              </div>
              <a
                href={rightSource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="source-pill"
                aria-label={`${rightSource.shortBadge} — otwórz publikację w nowej karcie`}
                title={rightSource.citation}
              >
                <span>{rightSource.shortBadge}</span>
                <ExternalLink size={11} strokeWidth={2} aria-hidden="true" />
              </a>
            </div>
          </foreignObject>
        </g>

        {/* Center Calibrated Logarithmic Vernier Fulcrum Dial (1x – 10 000x) */}
        <g aria-hidden="true">
          <circle
            cx={cx}
            cy={cy}
            r="80"
            fill="#F4F2EC"
            stroke="#141615"
            strokeWidth="1.8"
          />
          <circle
            cx={cx}
            cy={cy}
            r="75"
            fill="none"
            stroke="rgba(20, 22, 21, 0.22)"
            strokeWidth="0.75"
          />
          {dialTicks.map((t, idx) => (
            <g key={idx}>
              <line
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={t.label === '1×' ? '#A44B27' : '#141615'}
                strokeWidth={t.isMajor ? '1.4' : '0.75'}
              />
              {t.label && t.lx !== undefined && t.ly !== undefined && (
                <text
                  x={t.lx}
                  y={t.ly + 3}
                  textAnchor="middle"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="8.5"
                  fontWeight={t.label === '1×' ? '700' : '500'}
                  fill={t.label === '1×' ? '#A44B27' : '#5A605C'}
                >
                  {t.label}
                </text>
              )}
            </g>
          ))}

          {/* Copper Fulcrum Needle with Damped Spring Physics */}
          <g
            className="balance-needle-group"
            style={{ transform: `rotate(${needleDeg}deg)` }}
          >
            <polygon
              points={`${cx - 3.4},${cy} ${cx},${cy - 63} ${cx + 3.4},${cy}`}
              fill="#A44B27"
            />
            <circle
              cx={cx}
              cy={cy}
              r="10.5"
              fill="#F4F2EC"
              stroke="#A44B27"
              strokeWidth="2.4"
            />
            <circle cx={cx} cy={cy} r="4.2" fill="#141615" />
          </g>

          {/* Center Log Scale Caption */}
          <text
            x={cx}
            y={cy + 34}
            textAnchor="middle"
            fontFamily="JetBrains Mono, monospace"
            fontSize="9.5"
            fontWeight="500"
            letterSpacing="0.06em"
            fill="#5A605C"
          >
            {counterActive ? 'WYRÓWNANO' : 'SKALA LOG'}
          </text>
          <text
            x={cx}
            y={cy + 52}
            textAnchor="middle"
            fontFamily="Archivo, sans-serif"
            fontSize="15.5"
            fontWeight="800"
            fill="#141615"
          >
            {animatedRatioLabel}
          </text>
        </g>
      </svg>

      {/* Mobile Interactive Metrology Balance (Beam + 2-Column Pans + 1:1 GPU Split Bar) */}
      <div className="mobile-balance-wrap">
        <svg
          className="mobile-beam-svg"
          viewBox="0 0 360 144"
          aria-hidden="true"
        >
          <line
            x1="18"
            y1="62"
            x2="342"
            y2="62"
            stroke="rgba(20, 22, 21, 0.1)"
            strokeWidth="1"
            strokeDasharray="3 5"
          />

          <g
            className="mobile-beam-group"
            style={{ transform: `rotate(${angleDeg}deg)` }}
          >
            <rect
              x="44"
              y="57.5"
              width="272"
              height="9"
              rx="1.5"
              fill="#F4F2EC"
              stroke="#141615"
              strokeWidth="1.5"
            />
            <circle cx="52" cy="62" r="2.2" fill="#141615" />
            <circle cx="308" cy="62" r="2.2" fill="#141615" />
          </g>

          {/* Left Mini Pan */}
          <g
            className="balance-pan-group"
            style={{
              transform: `translate(${180 - 128 * Math.cos(angleRad)}px, ${
                62 - 128 * Math.sin(angleRad)
              }px)`,
            }}
          >
            <line x1="0" y1="5" x2="-24" y2="34" stroke="#141615" strokeWidth="1.25" />
            <line x1="0" y1="5" x2="24" y2="34" stroke="#141615" strokeWidth="1.25" />
            <rect
              x={!counterActive && ratio.heavier === 'left' ? -15 : -8}
              y={!counterActive && ratio.heavier === 'left' ? 20 : 27}
              width={!counterActive && ratio.heavier === 'left' ? 30 : 16}
              height={!counterActive && ratio.heavier === 'left' ? 14 : 7}
              rx="1.5"
              fill={
                counterActive || ratio.heavier === 'left' ? '#A44B27' : '#3F4441'
              }
            />
            <path
              d="M -30 34 Q 0 46 30 34 Z"
              fill={!counterActive && ratio.heavier === 'left' ? '#141615' : '#ECEAE3'}
              stroke="#141615"
              strokeWidth="1.4"
            />
          </g>

          {/* Right Mini Pan */}
          <g
            className="balance-pan-group"
            style={{
              transform: `translate(${180 + 128 * Math.cos(angleRad)}px, ${
                62 + 128 * Math.sin(angleRad)
              }px)`,
            }}
          >
            <line x1="0" y1="5" x2="-24" y2="34" stroke="#141615" strokeWidth="1.25" />
            <line x1="0" y1="5" x2="24" y2="34" stroke="#141615" strokeWidth="1.25" />
            <rect
              x={!counterActive && ratio.heavier === 'right' ? -15 : -8}
              y={!counterActive && ratio.heavier === 'right' ? 20 : 27}
              width={!counterActive && ratio.heavier === 'right' ? 30 : 16}
              height={!counterActive && ratio.heavier === 'right' ? 14 : 7}
              rx="1.5"
              fill={
                counterActive || ratio.heavier === 'right' ? '#A44B27' : '#3F4441'
              }
            />
            <path
              d="M -30 34 Q 0 46 30 34 Z"
              fill={!counterActive && ratio.heavier === 'right' ? '#141615' : '#ECEAE3'}
              stroke="#141615"
              strokeWidth="1.4"
            />
          </g>

          {/* Center Vernier Dial */}
          <g>
            <circle
              cx="180"
              cy="62"
              r="39"
              fill="#F4F2EC"
              stroke="#141615"
              strokeWidth="1.6"
            />
            {mobileDialTicks.map((t, i) => (
              <line
                key={i}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke="#141615"
                strokeWidth={t.isMajor ? 1.2 : 0.7}
              />
            ))}
            <g
              className="mobile-needle-group"
              style={{ transform: `rotate(${needleDeg}deg)` }}
            >
              <polygon points="178,62 180,30 182,62" fill="#A44B27" />
              <circle
                cx="180"
                cy="62"
                r="6"
                fill="#F4F2EC"
                stroke="#A44B27"
                strokeWidth="2"
              />
              <circle cx="180" cy="62" r="2.4" fill="#141615" />
            </g>
            <text
              x="180"
              y="79"
              textAnchor="middle"
              fontFamily="JetBrains Mono, monospace"
              fontSize="7"
              letterSpacing="0.06em"
              fill="#5A605C"
            >
              {counterActive ? 'WYRÓWNANO' : 'SKALA LOG'}
            </text>
            <text
              x="180"
              y="92"
              textAnchor="middle"
              fontFamily="Archivo, sans-serif"
              fontSize="11"
              fontWeight="800"
              fill="#141615"
            >
              {animatedRatioLabel}
            </text>
          </g>
        </svg>

        {/* Two-Column Side-by-Side Pan Cards */}
        <div className="mobile-pan-grid">
          <div
            className={`pan-foreign-card mobile-pan-card ${
              !counterActive && ratio.heavier === 'left'
                ? 'heavier is-lower'
                : counterActive
                ? 'counterweighted'
                : 'is-higher'
            }`}
          >
            <div className="pan-selector-row">
              {leftMultiplier > 1 && (
                <span className="multiplier-badge mono">
                  ×{formatMultiplier(leftMultiplier)}
                </span>
              )}
              <select
                aria-label="Wybierz decyzję na lewej szalce"
                className="pan-select mobile-pan-select"
                value={leftItem.id}
                onChange={(e) => onSelectLeft(e.target.value)}
              >
                {renderGroupedOptions(true)}
              </select>
            </div>
            <div className="pan-primary-value mobile-pan-value tabular">
              {formatMetricValue(animLeftVal, activeMetric)}
            </div>
            <div className="pan-secondary-metrics mobile-pan-secondary tabular">
              {leftMultiplier > 1
                ? `1 szt.: ${formatMetricValue(rawLeftVal, activeMetric)}`
                : getSecondarySummary(leftItem, activeMetric)}
            </div>
            <a
              href={leftSource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="source-pill mobile-source-pill"
              aria-label={`${leftSource.shortBadge} — otwórz publikację w nowej karcie`}
            >
              <span>{leftSource.shortBadge}</span>
              <ExternalLink size={10} aria-hidden="true" />
            </a>
          </div>

          <div
            className={`pan-foreign-card mobile-pan-card ${
              !counterActive && ratio.heavier === 'right'
                ? 'heavier is-lower'
                : counterActive
                ? 'counterweighted'
                : 'is-higher'
            }`}
          >
            <div className="pan-selector-row">
              {rightMultiplier > 1 && (
                <span className="multiplier-badge mono">
                  ×{formatMultiplier(rightMultiplier)}
                </span>
              )}
              <select
                aria-label="Wybierz decyzję na prawej szalce"
                className="pan-select mobile-pan-select"
                value={rightItem.id}
                onChange={(e) => onSelectRight(e.target.value)}
              >
                {renderGroupedOptions(true)}
              </select>
            </div>
            <div className="pan-primary-value mobile-pan-value tabular">
              {formatMetricValue(animRightVal, activeMetric)}
            </div>
            <div className="pan-secondary-metrics mobile-pan-secondary tabular">
              {rightMultiplier > 1
                ? `1 szt.: ${formatMetricValue(rawRightVal, activeMetric)}`
                : getSecondarySummary(rightItem, activeMetric)}
            </div>
            <a
              href={rightSource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="source-pill mobile-source-pill"
              aria-label={`${rightSource.shortBadge} — otwórz publikację w nowej karcie`}
            >
              <span>{rightSource.shortBadge}</span>
              <ExternalLink size={10} aria-hidden="true" />
            </a>
          </div>
        </div>

        {/* GPU-Composited 1:1 Proportional Split Bar */}
        <div className="mobile-proportion-bar-wrap">
          <div className="mobile-proportion-header">
            <span className="mono">PROPORCJA 1:1 ({METRICS[activeMetric].shortLabel})</span>
            <button
              type="button"
              className="swap-inline-btn"
              onClick={onSwap}
              aria-label="Zamień szalki miejscami"
            >
              <ArrowLeftRight size={12} aria-hidden="true" />
              <span>Zamień</span>
            </button>
          </div>
          <div className="mobile-proportion-track" aria-hidden="true">
            <div
              className={`mobile-proportion-fill-left ${
                !counterActive && ratio.heavier === 'left' ? 'is-copper' : 'is-graphite'
              }`}
              style={{ transform: `scaleX(${mobileLeftShare})` }}
            />
            <div
              className={`mobile-proportion-fill-right ${
                !counterActive && ratio.heavier === 'right' ? 'is-copper' : 'is-graphite'
              }`}
              style={{ transform: `scaleX(${mobileRightShare})` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
