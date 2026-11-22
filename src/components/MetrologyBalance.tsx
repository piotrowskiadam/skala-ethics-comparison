import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeftRight, ChevronDown, ExternalLink, Scale } from 'lucide-react';
import {
  DecisionItem,
  METRICS,
  METRIC_ORDER,
  MetricKey,
  SOURCES,
  formatMetricValue,
  formatNumberPL,
  formatRatio,
} from '../data/evidence';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';
import { TrueScaleWeightChamber } from './TrueScaleWeightChamber';

interface MetrologyBalanceProps {
  leftItem: DecisionItem;
  rightItem: DecisionItem;
  leftFreq: number;
  rightFreq: number;
  activeMetric: MetricKey;
  isCounterbalanced: boolean;
  onChangeMetric: (m: MetricKey) => void;
  onToggleCounterbalance: () => void;
  onOpenPicker: (side: 'left' | 'right') => void;
  onChangeLeftFreq: (freq: number) => void;
  onChangeRightFreq: (freq: number) => void;
  onSwap: () => void;
}

const FREQ_OPTIONS = [
  { value: 1, label: '1×' },
  { value: 52, label: '52×/rok' },
  { value: 365, label: '365×/rok' },
];

function getSecondarySummary(
  item: DecisionItem,
  freq: number,
  activeMetric: MetricKey,
): string {
  if (activeMetric === 'co2' && METRICS.co2.dailyBudget15C) {
    const pct = Math.round(((item.metrics.co2 * freq) / METRICS.co2.dailyBudget15C) * 100);
    return `${pct.toLocaleString('pl-PL')}% budżetu 1,5°C · ${formatNumberPL(
      item.metrics.water * freq,
    )} L`;
  }
  const parts: string[] = [];
  if (activeMetric !== 'co2') {
    parts.push(`${formatNumberPL(item.metrics.co2 * freq)} kg CO₂e`);
  }
  if (activeMetric !== 'water') {
    parts.push(`${formatNumberPL(item.metrics.water * freq)} L wody`);
  }
  if (activeMetric !== 'land' && parts.length < 2) {
    parts.push(`${formatNumberPL(item.metrics.land * freq)} m²`);
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

function describeArc(
  cx: number,
  cy: number,
  r: number,
  startDeg: number,
  endDeg: number,
): string {
  if (Math.abs(endDeg - startDeg) < 0.5) return '';
  const s = ((startDeg - 90) * Math.PI) / 180;
  const e = ((endDeg - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(s);
  const y1 = cy + r * Math.sin(s);
  const x2 = cx + r * Math.cos(e);
  const y2 = cy + r * Math.sin(e);
  const largeArc = Math.abs(endDeg - startDeg) > 180 ? 1 : 0;
  const sweep = endDeg > startDeg ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${largeArc} ${sweep} ${x2.toFixed(
    2,
  )} ${y2.toFixed(2)}`;
}

function getMobilePanStackGeometry(multiplier: number, isCounterActive: boolean) {
  if (!isCounterActive || multiplier <= 1.05) {
    return { wireDrop: 34, rows: 1, blockW: 10.5, blockH: 6.5, gapX: 2.2, gapY: 2, cols: 4 };
  }
  const fullCount = Math.floor(multiplier);
  const hasFrac = multiplier - fullCount >= 0.08;
  const total = fullCount + (hasFrac ? 1 : 0);

  if (total <= 40) {
    const cols = total <= 12 ? 4 : total <= 24 ? 5 : 6;
    const blockW = cols === 4 ? 10.5 : cols === 5 ? 8.6 : 7.2;
    const blockH = cols === 4 ? 6.2 : cols === 5 ? 5.2 : 4.5;
    const gapX = cols === 4 ? 2 : 1.6;
    const gapY = 1.6;
    const rows = Math.ceil(total / cols);
    const stackH = rows * blockH + (rows - 1) * gapY;
    const wireDrop = Math.max(34, Math.ceil(stackH + 18));
    return { wireDrop, rows, blockW, blockH, gapX, gapY, cols };
  }

  return { wireDrop: 58, rows: 4, blockW: 7.2, blockH: 4.5, gapX: 1.6, gapY: 1.6, cols: 6 };
}

function renderMobilePanWeights(
  multiplier: number,
  isCounterActive: boolean,
  isHeavier: boolean,
  wireDrop: number,
) {
  if (!isCounterActive || multiplier <= 1.05) {
    const isHeavyRef = isCounterActive || isHeavier;
    return (
      <g>
        <rect
          x={isHeavyRef ? -14 : -8}
          y={isHeavyRef ? wireDrop - 13 : wireDrop - 7}
          width={isHeavyRef ? 28 : 16}
          height={isHeavyRef ? 13 : 7}
          rx="1.5"
          fill={isHeavyRef ? '#A44B27' : '#3F4441'}
          stroke="#141615"
          strokeWidth="0.7"
        />
      </g>
    );
  }

  const geom = getMobilePanStackGeometry(multiplier, isCounterActive);
  const fullCount = Math.floor(multiplier);
  const frac = multiplier - fullCount;
  const capped = fullCount > 40;
  const visibleFull = capped ? 24 : fullCount;
  const showFrac = !capped && frac >= 0.08;

  const items: { w: number; isFrac: boolean }[] = [];
  for (let i = 0; i < visibleFull; i++) items.push({ w: geom.blockW, isFrac: false });
  if (showFrac) items.push({ w: Math.max(2.8, geom.blockW * frac), isFrac: true });

  const rows: { w: number; isFrac: boolean }[][] = [];
  for (let i = 0; i < items.length; i += geom.cols) rows.push(items.slice(i, i + geom.cols));

  return (
    <g>
      {rows.map((row, rowIdx) => {
        const totalRowW =
          row.reduce((sum, b) => sum + b.w, 0) + (row.length - 1) * geom.gapX;
        let curX = -totalRowW / 2;
        const y = wireDrop - (rowIdx + 1) * geom.blockH - rowIdx * geom.gapY - 0.5;
        return row.map((block, colIdx) => {
          const x = curX;
          curX += block.w + geom.gapX;
          return (
            <rect
              key={`${rowIdx}-${colIdx}`}
              x={x}
              y={y}
              width={block.w}
              height={geom.blockH}
              rx="1.1"
              fill={block.isFrac ? '#C97B57' : '#A44B27'}
              stroke="#141615"
              strokeWidth="0.6"
            />
          );
        });
      })}
      {capped && (
        <text
          x="0"
          y={wireDrop - rows.length * (geom.blockH + geom.gapY) - 4}
          textAnchor="middle"
          fontFamily="JetBrains Mono, monospace"
          fontSize="7.2"
          fontWeight="700"
          fill="#A44B27"
        >
          ×{formatMultiplier(multiplier)} ↓
        </text>
      )}
    </g>
  );
}

function renderDesktopWeightStrip(multiplier: number) {
  const fullCount = Math.floor(multiplier);
  const frac = multiplier - fullCount;
  const maxVisible = 10;
  const capped = fullCount >= maxVisible;
  const visibleFull = capped ? maxVisible : fullCount;
  const showFrac = !capped && frac >= 0.08;

  return (
    <div
      className="pan-weight-blocks"
      aria-label={`Wizualizacja ${formatMultiplier(multiplier)} odważników`}
    >
      {Array.from({ length: visibleFull }, (_, i) => (
        <span key={i} className="weight-block" />
      ))}
      {showFrac && (
        <span
          className="weight-block is-frac"
          style={{ width: `${Math.max(4, Math.round(14 * frac))}px` }}
        />
      )}
      {capped && (
        <span className="weight-block-more mono">
          +{Math.round(multiplier - maxVisible).toLocaleString('pl-PL')}
        </span>
      )}
    </div>
  );
}

export const MetrologyBalance: React.FC<MetrologyBalanceProps> = ({
  leftItem,
  rightItem,
  leftFreq,
  rightFreq,
  activeMetric,
  isCounterbalanced,
  onChangeMetric,
  onToggleCounterbalance,
  onOpenPicker,
  onChangeLeftFreq,
  onChangeRightFreq,
  onSwap,
}) => {
  const [hasEntered, setHasEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setHasEntered(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const rawLeftVal = leftItem.metrics[activeMetric] * leftFreq;
  const rawRightVal = rightItem.metrics[activeMetric] * rightFreq;
  const ratio = formatRatio(rawLeftVal, rawRightVal);

  const isSame = ratio.heavier === 'equal';
  const counterActive = isCounterbalanced && !isSame;

  const leftMultiplier = counterActive && ratio.heavier === 'right' ? ratio.factor : 1;
  const rightMultiplier = counterActive && ratio.heavier === 'left' ? ratio.factor : 1;

  const effectiveLeftVal = rawLeftVal * leftMultiplier;
  const effectiveRightVal = rawRightVal * rightMultiplier;

  const animLeftVal = useAnimatedNumber(effectiveLeftVal, 420);
  const animRightVal = useAnimatedNumber(effectiveRightVal, 420);
  const animFactor = useAnimatedNumber(counterActive ? 1 : ratio.factor, 420);

  const signedLog = counterActive
    ? 0
    : Math.log10(Math.max(rawRightVal, 1e-6) / Math.max(rawLeftVal, 1e-6));

  const targetAngleDeg = Math.max(-13.5, Math.min(13.5, (signedLog / 4) * 13.5));
  const targetNeedleDeg = Math.max(-110, Math.min(110, signedLog * 27.5));

  const angleDeg = hasEntered ? targetAngleDeg : 0;
  const needleDeg = hasEntered ? targetNeedleDeg : 0;
  const angleRad = (angleDeg * Math.PI) / 180;

  const cx = 590;
  const cy = 112; // Reclaimed 46px of dead void above dial for crisp 1440x900 fit
  const armLength = 382;

  const animNeedleDeg = useAnimatedNumber(needleDeg, 560);
  const desktopArcPath = describeArc(cx, cy, 70.5, 0, animNeedleDeg);
  const mobileArcPath = describeArc(180, 62, 34, 0, animNeedleDeg);

  const leftHookX = cx - armLength * Math.cos(angleRad);
  const leftHookY = cy - armLength * Math.sin(angleRad);
  const rightHookX = cx + armLength * Math.cos(angleRad);
  const rightHookY = cy + armLength * Math.sin(angleRad);

  const leftSource = SOURCES[leftItem.primarySourceId];
  const rightSource = SOURCES[rightItem.primarySourceId];

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
      const rLabel = 49;

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

  const panW = 298;
  const panH = 182;
  const panDrop = 44;

  const animatedRatioLabel = useMemo(() => {
    if (counterActive || isSame) return '1 : 1,0';
    const f = formatMultiplier(animFactor);
    return ratio.heavier === 'right' ? `1 : ${f}` : `${f} : 1`;
  }, [animFactor, counterActive, isSame, ratio.heavier]);

  const lighterItem = ratio.heavier === 'left' ? rightItem : leftItem;
  const heavierItem = ratio.heavier === 'left' ? leftItem : rightItem;
  const lighterFreq = ratio.heavier === 'left' ? rightFreq : leftFreq;
  const heavierFreq = ratio.heavier === 'left' ? leftFreq : rightFreq;

  const mobileLeftShare = Math.max(
    0.04,
    effectiveLeftVal / Math.max(effectiveLeftVal + effectiveRightVal, 1e-6),
  );
  const mobileRightShare = Math.max(
    0.04,
    effectiveRightVal / Math.max(effectiveLeftVal + effectiveRightVal, 1e-6),
  );

  const mobileMaxMult = Math.max(leftMultiplier, rightMultiplier);
  const mobileWireDrop = getMobilePanStackGeometry(mobileMaxMult, counterActive).wireDrop;
  const mobileSvgH = Math.max(144, 62 + mobileWireDrop + 52);

  return (
    <div className="balance-canvas-wrap">
      {/* Settled screen-reader announcement (zero 60fps rAF spam) */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {counterActive
          ? `Waga wyrównana: ${formatMultiplier(ratio.factor)} razy ${lighterItem.name} równa się ${heavierItem.name} w wymiarze ${METRICS[activeMetric].fullName}.`
          : `Stosunek ${ratio.label} w wymiarze ${METRICS[activeMetric].fullName}: ${leftItem.name} (${formatMetricValue(
              rawLeftVal,
              activeMetric,
            )}) wobec ${rightItem.name} (${formatMetricValue(rawRightVal, activeMetric)}).`}
      </div>

      {/* Editorial Hero Ratio Header */}
      <div className="hero-ratio-bar">
        <div className="hero-ratio-readout">
          <span className="mono hero-ratio-label">
            {counterActive
              ? 'RÓWNOWAGA SZALEK · KOMORA 1:1 AKTYWNA'
              : isSame
              ? 'IDENTYCZNE OBCIĄŻENIE'
              : `PORÓWNANIE · ${METRICS[activeMetric].shortLabel}`}
          </span>
          <h1 className="hero-ratio-number tabular">
            {counterActive ? (
              <>
                <span className="ratio-accent">
                  {formatMultiplier(ratio.factor)}×
                </span>{' '}
                {lighterFreq > 1 ? `(${lighterFreq}×) ` : ''}
                {lighterItem.shortLabel} <span className="ratio-eq">=</span>{' '}
                {heavierFreq > 1 ? `${heavierFreq}× ` : '1× '}
                {heavierItem.shortLabel}
              </>
            ) : (
              <>
                <span className="ratio-accent">{animatedRatioLabel}</span>
                {!isSame && (
                  <span className="hero-ratio-sub">
                    {heavierFreq > 1 ? `${heavierFreq}× ` : ''}
                    {heavierItem.shortLabel} przeważa {formatMultiplier(ratio.factor)}×
                  </span>
                )}
              </>
            )}
          </h1>
        </div>

        {!isSame && (
          <button
            type="button"
            className={`counterbalance-btn ${counterActive ? 'active' : ''}`}
            aria-pressed={counterActive}
            onClick={onToggleCounterbalance}
          >
            <Scale size={15} strokeWidth={2} aria-hidden="true" />
            <span>
              {counterActive
                ? 'Zdejmij odważniki (1 vs 1)'
                : `Wyrównaj wagę (×${formatMultiplier(ratio.factor)})`}
            </span>
          </button>
        )}
      </div>

      {/* Desktop Interactive Machined Metrology Balance SVG */}
      <svg
        className="balance-svg"
        viewBox="0 0 1180 434"
        role="group"
        aria-label={`Waga metrologiczna porównująca ${leftItem.name} oraz ${rightItem.name}`}
      >
        <defs>
          <linearGradient id="beamMetal" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FAF8F3" />
            <stop offset="55%" stopColor="#EAE6DC" />
            <stop offset="100%" stopColor="#D7D2C5" />
          </linearGradient>
          <linearGradient id="pedestalGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#262927" />
            <stop offset="45%" stopColor="#3B403D" />
            <stop offset="100%" stopColor="#141615" />
          </linearGradient>
        </defs>

        <line
          x1="90"
          y1={cy}
          x2="1090"
          y2={cy}
          stroke="rgba(20, 22, 21, 0.1)"
          strokeWidth="1"
          strokeDasharray="4 6"
          aria-hidden="true"
        />

        {/* Machined Fulcrum Pedestal Pillar */}
        <g aria-hidden="true">
          <path
            d={`M ${cx - 16} ${cy + 74} L ${cx - 24} 388 L ${cx + 24} 388 L ${cx + 16} ${
              cy + 74
            } Z`}
            fill="url(#pedestalGrad)"
            stroke="#141615"
            strokeWidth="1.2"
          />
          <rect x={cx - 64} y="388" width="128" height="10" rx="2" fill="#141615" />
          <rect
            x={cx - 86}
            y="398"
            width="172"
            height="7"
            rx="1.5"
            fill="#3F4441"
            stroke="#141615"
            strokeWidth="1"
          />
        </g>

        {/* Tilting Machined Precision Beam */}
        <g
          className="balance-beam-group"
          style={{ transform: `rotate(${angleDeg}deg)` }}
          aria-hidden="true"
        >
          <rect
            x={cx - armLength - 14}
            y={cy - 8}
            width={(armLength + 14) * 2}
            height="16"
            rx="2"
            fill="url(#beamMetal)"
            stroke="#141615"
            strokeWidth="1.6"
          />
          <line
            x1={cx - armLength + 14}
            y1={cy}
            x2={cx + armLength - 14}
            y2={cy}
            stroke="rgba(20, 22, 21, 0.22)"
            strokeWidth="1"
          />
          <circle cx={cx - armLength} cy={cy} r="3.5" fill="#A44B27" stroke="#141615" strokeWidth="1" />
          <circle cx={cx + armLength} cy={cy} r="3.5" fill="#A44B27" stroke="#141615" strokeWidth="1" />

          <path
            d={`M ${cx - armLength} ${cy + 8} L ${cx - armLength} ${cy + 18} C ${
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
            d={`M ${cx + armLength} ${cy + 8} L ${cx + armLength} ${cy + 18} C ${
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
          <g aria-hidden="true">
            <line x1="0" y1="20" x2={-panW * 0.34} y2={panDrop + 4} stroke="#141615" strokeWidth="1.35" />
            <line x1="0" y1="20" x2={panW * 0.34} y2={panDrop + 4} stroke="#141615" strokeWidth="1.35" />
            <path
              d={`M ${-panW / 2 - 10} ${panDrop + panH - 2} Q 0 ${panDrop + panH + 16} ${
                panW / 2 + 10
              } ${panDrop + panH - 2} Z`}
              fill={!counterActive && ratio.heavier === 'left' ? '#141615' : '#ECEAE3'}
              stroke="#141615"
              strokeWidth="1.5"
            />
          </g>
          <foreignObject
            x={-panW / 2}
            y={panDrop - 12}
            width={panW}
            height={panH + 14}
            overflow="visible"
          >
            <div className="pan-fo-shell">
              {leftMultiplier > 1 && (
                <span className="pan-floating-mult mono">
                  ×{formatMultiplier(leftMultiplier)} odważników
                </span>
              )}
              <div
                className={`pan-foreign-card ${
                  !counterActive && ratio.heavier === 'left' ? 'heavier' : ''
                } ${counterActive && leftMultiplier > 1 ? 'counterweighted' : ''}`}
              >
                <button
                  type="button"
                  className="pan-picker-trigger"
                  onClick={() => onOpenPicker('left')}
                  aria-label={`Zmień decyzję na lewej szalce: ${leftItem.name}`}
                >
                  <span className="pan-trigger-label">{leftItem.name}</span>
                  <ChevronDown size={14} className="pan-trigger-chevron" aria-hidden="true" />
                </button>

                <div className="pan-primary-value tabular">
                  {formatMetricValue(animLeftVal, activeMetric)}
                </div>

                <div className="pan-secondary-metrics tabular">
                  {leftMultiplier > 1 ? (
                    renderDesktopWeightStrip(leftMultiplier)
                  ) : counterActive ? (
                    <div className="pan-weight-blocks" aria-label="1 odważnik referencyjny">
                      <span className="weight-block is-ref" />
                      <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--ink-muted)' }}>
                        1× wzorzec
                      </span>
                    </div>
                  ) : (
                    getSecondarySummary(leftItem, leftFreq, activeMetric)
                  )}
                </div>

                <div className="pan-footer-row">
                  <div className="freq-stepper" role="group" aria-label="Częstotliwość lewej szalki">
                    {FREQ_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`freq-btn mono ${leftFreq === opt.value ? 'active' : ''}`}
                        aria-pressed={leftFreq === opt.value}
                        onClick={() => onChangeLeftFreq(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <a
                    href={leftSource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-pill pan-source-compact"
                    aria-label={`${leftSource.shortBadge} — otwórz publikację w nowej karcie`}
                    title={leftSource.citation}
                  >
                    <span className="source-pill-text">{leftSource.shortBadge}</span>
                    <ExternalLink size={10} className="source-pill-icon" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </foreignObject>
        </g>

        {/* Right Gravity-Leveled Pan */}
        <g
          className="balance-pan-group"
          style={{ transform: `translate(${rightHookX}px, ${rightHookY}px)` }}
        >
          <g aria-hidden="true">
            <line x1="0" y1="20" x2={-panW * 0.34} y2={panDrop + 4} stroke="#141615" strokeWidth="1.35" />
            <line x1="0" y1="20" x2={panW * 0.34} y2={panDrop + 4} stroke="#141615" strokeWidth="1.35" />
            <path
              d={`M ${-panW / 2 - 10} ${panDrop + panH - 2} Q 0 ${panDrop + panH + 16} ${
                panW / 2 + 10
              } ${panDrop + panH - 2} Z`}
              fill={!counterActive && ratio.heavier === 'right' ? '#141615' : '#ECEAE3'}
              stroke="#141615"
              strokeWidth="1.5"
            />
          </g>
          <foreignObject
            x={-panW / 2}
            y={panDrop - 12}
            width={panW}
            height={panH + 14}
            overflow="visible"
          >
            <div className="pan-fo-shell">
              {rightMultiplier > 1 && (
                <span className="pan-floating-mult mono">
                  ×{formatMultiplier(rightMultiplier)} odważników
                </span>
              )}
              <div
                className={`pan-foreign-card ${
                  !counterActive && ratio.heavier === 'right' ? 'heavier' : ''
                } ${counterActive && rightMultiplier > 1 ? 'counterweighted' : ''}`}
              >
                <button
                  type="button"
                  className="pan-picker-trigger"
                  onClick={() => onOpenPicker('right')}
                  aria-label={`Zmień decyzję na prawej szalce: ${rightItem.name}`}
                >
                  <span className="pan-trigger-label">{rightItem.name}</span>
                  <ChevronDown size={14} className="pan-trigger-chevron" aria-hidden="true" />
                </button>

                <div className="pan-primary-value tabular">
                  {formatMetricValue(animRightVal, activeMetric)}
                </div>

                <div className="pan-secondary-metrics tabular">
                  {rightMultiplier > 1 ? (
                    renderDesktopWeightStrip(rightMultiplier)
                  ) : counterActive ? (
                    <div className="pan-weight-blocks" aria-label="1 odważnik referencyjny">
                      <span className="weight-block is-ref" />
                      <span className="mono" style={{ fontSize: '0.68rem', color: 'var(--ink-muted)' }}>
                        1× wzorzec
                      </span>
                    </div>
                  ) : (
                    getSecondarySummary(rightItem, rightFreq, activeMetric)
                  )}
                </div>

                <div className="pan-footer-row">
                  <div className="freq-stepper" role="group" aria-label="Częstotliwość prawej szalki">
                    {FREQ_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        className={`freq-btn mono ${rightFreq === opt.value ? 'active' : ''}`}
                        aria-pressed={rightFreq === opt.value}
                        onClick={() => onChangeRightFreq(opt.value)}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  <a
                    href={rightSource.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="source-pill pan-source-compact"
                    aria-label={`${rightSource.shortBadge} — otwórz publikację w nowej karcie`}
                    title={rightSource.citation}
                  >
                    <span className="source-pill-text">{rightSource.shortBadge}</span>
                    <ExternalLink size={10} className="source-pill-icon" aria-hidden="true" />
                  </a>
                </div>
              </div>
            </div>
          </foreignObject>
        </g>

        {/* Center Calibrated Logarithmic Vernier Fulcrum Dial */}
        <g aria-hidden="true">
          <circle cx={cx} cy={cy} r="82" fill="#F4F2EC" stroke="#141615" strokeWidth="2" />
          <circle cx={cx} cy={cy} r="76" fill="none" stroke="rgba(20, 22, 21, 0.22)" strokeWidth="0.75" />

          {desktopArcPath && (
            <path
              d={desktopArcPath}
              fill="none"
              stroke="rgba(164, 75, 39, 0.28)"
              strokeWidth="9"
              strokeLinecap="butt"
            />
          )}

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

          <g
            className="balance-needle-group"
            style={{ transform: `rotate(${needleDeg}deg)` }}
          >
            <polygon points={`${cx - 3.6},${cy} ${cx},${cy - 65} ${cx + 3.6},${cy}`} fill="#A44B27" />
            <circle cx={cx} cy={cy} r="11" fill="#F4F2EC" stroke="#A44B27" strokeWidth="2.5" />
            <circle cx={cx} cy={cy} r="4.2" fill="#141615" />
          </g>

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
            y={cy + 53}
            textAnchor="middle"
            fontFamily="Archivo, sans-serif"
            fontSize="16"
            fontWeight="800"
            fill="#141615"
          >
            {animatedRatioLabel}
          </text>
        </g>
      </svg>

      {/* Mobile Interactive Metrology Balance */}
      <div className="mobile-balance-wrap">
        <svg className="mobile-beam-svg" viewBox={`0 0 360 ${mobileSvgH}`} aria-hidden="true">
          <line
            x1="18"
            y1="62"
            x2="342"
            y2="62"
            stroke="rgba(20, 22, 21, 0.1)"
            strokeWidth="1"
            strokeDasharray="3 5"
          />
          <g className="mobile-beam-group" style={{ transform: `rotate(${angleDeg}deg)` }}>
            <rect x="44" y="57.5" width="272" height="9" rx="1.5" fill="#F4F2EC" stroke="#141615" strokeWidth="1.5" />
            <circle cx="52" cy="62" r="2.2" fill="#A44B27" />
            <circle cx="308" cy="62" r="2.2" fill="#A44B27" />
          </g>

          <g
            className="balance-pan-group"
            style={{
              transform: `translate(${180 - 128 * Math.cos(angleRad)}px, ${
                62 - 128 * Math.sin(angleRad)
              }px)`,
            }}
          >
            <line x1="0" y1="5" x2="-28" y2={mobileWireDrop} stroke="#141615" strokeWidth="1.25" />
            <line x1="0" y1="5" x2="28" y2={mobileWireDrop} stroke="#141615" strokeWidth="1.25" />
            {renderMobilePanWeights(leftMultiplier, counterActive, ratio.heavier === 'left', mobileWireDrop)}
            <path
              d={`M -32 ${mobileWireDrop} Q 0 ${mobileWireDrop + 12} 32 ${mobileWireDrop} Z`}
              fill={!counterActive && ratio.heavier === 'left' ? '#141615' : '#ECEAE3'}
              stroke="#141615"
              strokeWidth="1.4"
            />
          </g>

          <g
            className="balance-pan-group"
            style={{
              transform: `translate(${180 + 128 * Math.cos(angleRad)}px, ${
                62 + 128 * Math.sin(angleRad)
              }px)`,
            }}
          >
            <line x1="0" y1="5" x2="-28" y2={mobileWireDrop} stroke="#141615" strokeWidth="1.25" />
            <line x1="0" y1="5" x2="28" y2={mobileWireDrop} stroke="#141615" strokeWidth="1.25" />
            {renderMobilePanWeights(rightMultiplier, counterActive, ratio.heavier === 'right', mobileWireDrop)}
            <path
              d={`M -32 ${mobileWireDrop} Q 0 ${mobileWireDrop + 12} 32 ${mobileWireDrop} Z`}
              fill={!counterActive && ratio.heavier === 'right' ? '#141615' : '#ECEAE3'}
              stroke="#141615"
              strokeWidth="1.4"
            />
          </g>

          <g>
            <circle cx="180" cy="62" r="39" fill="#F4F2EC" stroke="#141615" strokeWidth="1.6" />
            {mobileArcPath && (
              <path d={mobileArcPath} fill="none" stroke="rgba(164, 75, 39, 0.28)" strokeWidth="5.5" />
            )}
            {mobileDialTicks.map((t, i) => (
              <line key={i} x1={t.x1} y1={t.y1} x2={t.x2} y2={t.y2} stroke="#141615" strokeWidth={t.isMajor ? 1.2 : 0.7} />
            ))}
            <g className="mobile-needle-group" style={{ transform: `rotate(${needleDeg}deg)` }}>
              <polygon points="178,62 180,30 182,62" fill="#A44B27" />
              <circle cx="180" cy="62" r="6" fill="#F4F2EC" stroke="#A44B27" strokeWidth="2" />
              <circle cx="180" cy="62" r="2.4" fill="#141615" />
            </g>
            <text x="180" y="79" textAnchor="middle" fontFamily="JetBrains Mono, monospace" fontSize="7" letterSpacing="0.06em" fill="#5A605C">
              {counterActive ? 'WYRÓWNANO' : 'SKALA LOG'}
            </text>
            <text x="180" y="92" textAnchor="middle" fontFamily="Archivo, sans-serif" fontSize="11" fontWeight="800" fill="#141615">
              {animatedRatioLabel}
            </text>
          </g>
        </svg>

        {/* Two-Column Mobile Pan Cards */}
        <div className="mobile-pan-grid">
          <div
            className={`pan-foreign-card mobile-pan-card ${
              !counterActive && ratio.heavier === 'left'
                ? 'heavier is-lower'
                : counterActive && leftMultiplier > 1
                ? 'counterweighted'
                : counterActive
                ? 'heavier'
                : 'is-higher'
            }`}
          >
            {leftMultiplier > 1 && (
              <span className="multiplier-badge mono">×{formatMultiplier(leftMultiplier)}</span>
            )}
            <button
              type="button"
              className="pan-picker-trigger mobile-picker-trigger"
              onClick={() => onOpenPicker('left')}
              aria-label={`Zmień decyzję na lewej szalce: ${leftItem.shortLabel}`}
            >
              <span className="pan-trigger-label">{leftItem.shortLabel}</span>
              <ChevronDown size={13} className="pan-trigger-chevron" aria-hidden="true" />
            </button>
            <div className="pan-primary-value mobile-pan-value tabular">
              {formatMetricValue(animLeftVal, activeMetric)}
            </div>
            <div className="pan-secondary-metrics mobile-pan-secondary tabular">
              {leftMultiplier > 1
                ? `1 szt.: ${formatMetricValue(rawLeftVal, activeMetric)}`
                : getSecondarySummary(leftItem, leftFreq, activeMetric)}
            </div>
            <div className="freq-stepper mobile-freq-stepper" role="group" aria-label="Częstotliwość lewej szalki">
              {FREQ_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`freq-btn mono ${leftFreq === opt.value ? 'active' : ''}`}
                  aria-pressed={leftFreq === opt.value}
                  onClick={() => onChangeLeftFreq(opt.value)}
                >
                  {opt.value === 1 ? '1×' : opt.value === 52 ? '52×' : '365×'}
                </button>
              ))}
            </div>
            <a
              href={leftSource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="source-pill mobile-source-pill"
              aria-label={`${leftSource.shortBadge} — otwórz publikację w nowej karcie`}
            >
              <span className="source-pill-text">{leftSource.shortBadge}</span>
              <ExternalLink size={10} className="source-pill-icon" aria-hidden="true" />
            </a>
          </div>

          <div
            className={`pan-foreign-card mobile-pan-card ${
              !counterActive && ratio.heavier === 'right'
                ? 'heavier is-lower'
                : counterActive && rightMultiplier > 1
                ? 'counterweighted'
                : counterActive
                ? 'heavier'
                : 'is-higher'
            }`}
          >
            {rightMultiplier > 1 && (
              <span className="multiplier-badge mono">×{formatMultiplier(rightMultiplier)}</span>
            )}
            <button
              type="button"
              className="pan-picker-trigger mobile-picker-trigger"
              onClick={() => onOpenPicker('right')}
              aria-label={`Zmień decyzję na prawej szalce: ${rightItem.shortLabel}`}
            >
              <span className="pan-trigger-label">{rightItem.shortLabel}</span>
              <ChevronDown size={13} className="pan-trigger-chevron" aria-hidden="true" />
            </button>
            <div className="pan-primary-value mobile-pan-value tabular">
              {formatMetricValue(animRightVal, activeMetric)}
            </div>
            <div className="pan-secondary-metrics mobile-pan-secondary tabular">
              {rightMultiplier > 1
                ? `1 szt.: ${formatMetricValue(rawRightVal, activeMetric)}`
                : getSecondarySummary(rightItem, rightFreq, activeMetric)}
            </div>
            <div className="freq-stepper mobile-freq-stepper" role="group" aria-label="Częstotliwość prawej szalki">
              {FREQ_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`freq-btn mono ${rightFreq === opt.value ? 'active' : ''}`}
                  aria-pressed={rightFreq === opt.value}
                  onClick={() => onChangeRightFreq(opt.value)}
                >
                  {opt.value === 1 ? '1×' : opt.value === 52 ? '52×' : '365×'}
                </button>
              ))}
            </div>
            <a
              href={rightSource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="source-pill mobile-source-pill"
              aria-label={`${rightSource.shortBadge} — otwórz publikację w nowej karcie`}
            >
              <span className="source-pill-text">{rightSource.shortBadge}</span>
              <ExternalLink size={10} className="source-pill-icon" aria-hidden="true" />
            </a>
          </div>
        </div>

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

      {/* 4-Lens Multi-Metric Trade-off Fingerprint (all 4 dimensions alive simultaneously!) */}
      <div className="fingerprint-strip" role="group" aria-label="Profil porównania we wszystkich 4 wymiarach">
        {METRIC_ORDER.map((mKey) => {
          const lv = leftItem.metrics[mKey] * leftFreq;
          const rv = rightItem.metrics[mKey] * rightFreq;
          const r = formatRatio(lv, rv);
          const isCurrent = mKey === activeMetric;
          const total = Math.max(lv + rv, 1e-6);
          const lShare = Math.max(0.04, lv / total);
          const rShare = Math.max(0.04, rv / total);
          return (
            <button
              key={mKey}
              type="button"
              className={`fingerprint-cell ${isCurrent ? 'active' : ''}`}
              aria-pressed={isCurrent}
              onClick={() => onChangeMetric(mKey)}
            >
              <div className="fingerprint-top">
                <span className="mono fingerprint-metric">{METRICS[mKey].label}</span>
                <strong className="mono fingerprint-ratio">{r.label}</strong>
              </div>
              <div className="fingerprint-bar" aria-hidden="true">
                <span
                  className={`fingerprint-bar-l ${r.heavier === 'left' ? 'is-copper' : ''}`}
                  style={{ transform: `scaleX(${lShare})` }}
                />
                <span
                  className={`fingerprint-bar-r ${r.heavier === 'right' ? 'is-copper' : ''}`}
                  style={{ transform: `scaleX(${rShare})` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Full True-Proportion 1:1 Counterweight Chamber */}
      {counterActive && (
        <TrueScaleWeightChamber
          lighterItem={lighterItem}
          heavierItem={heavierItem}
          lighterSide={ratio.heavier === 'left' ? 'right' : 'left'}
          multiplier={ratio.factor}
          activeMetric={activeMetric}
        />
      )}
    </div>
  );
};
