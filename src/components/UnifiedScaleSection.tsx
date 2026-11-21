import React, { useMemo, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import {
  CATEGORY_LABELS,
  DECISIONS,
  DecisionCategory,
  METRICS,
  MetricKey,
  formatMetricValue,
  formatNumberPL,
  getDecisionById,
} from '../data/evidence';

interface UnifiedScaleSectionProps {
  activeMetric: MetricKey;
  leftId: string;
  rightId: string;
  onAssignLeft: (id: string) => void;
  onAssignRight: (id: string) => void;
}

function scrollSmoothOrAuto(top: number) {
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  window.scrollTo({ top, behavior: reduced ? 'auto' : 'smooth' });
}

export const UnifiedScaleSection: React.FC<UnifiedScaleSectionProps> = ({
  activeMetric,
  leftId,
  rightId,
  onAssignLeft,
  onAssignRight,
}) => {
  const [scaleMode, setScaleMode] = useState<'log' | 'linear'>('log');
  const [category, setCategory] = useState<DecisionCategory | 'all'>('all');
  const [hasAssignedFromTable, setHasAssignedFromTable] = useState(false);

  const meta = METRICS[activeMetric];
  const leftItem = getDecisionById(leftId);
  const rightItem = getDecisionById(rightId);

  const items = useMemo(() => {
    const filtered =
      category === 'all'
        ? DECISIONS
        : DECISIONS.filter((d) => d.category === category);
    return [...filtered].sort(
      (a, b) => a.metrics[activeMetric] - b.metrics[activeMetric],
    );
  }, [activeMetric, category]);

  const { minVal, maxVal, logMin, logMax } = useMemo(() => {
    const values = DECISIONS.map((d) => d.metrics[activeMetric]);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return {
      minVal: min,
      maxVal: max,
      logMin: Math.log10(Math.max(min, 1e-4) * 0.5),
      logMax: Math.log10(max * 1.15),
    };
  }, [activeMetric]);

  const computeWidthPct = (val: number): number => {
    if (scaleMode === 'linear') {
      return Math.max(0.5, (val / maxVal) * 100);
    }
    const pct = ((Math.log10(Math.max(val, 1e-4)) - logMin) / (logMax - logMin)) * 100;
    return Math.max(2, Math.min(100, pct));
  };

  // Real graduated ticks (decades in log mode, quartiles in linear mode)
  const axisTicks = useMemo(() => {
    if (scaleMode === 'linear') {
      return [0.25, 0.5, 0.75, 1].map((frac) => ({
        pct: frac * 100,
        label: formatNumberPL(maxVal * frac, 0),
      }));
    }
    const startExp = Math.ceil(logMin);
    const endExp = Math.floor(logMax);
    const ticks: { pct: number; label: string }[] = [];
    for (let exp = startExp; exp <= endExp; exp++) {
      const val = Math.pow(10, exp);
      const pct = ((exp - logMin) / (logMax - logMin)) * 100;
      if (pct >= 4 && pct <= 97) {
        ticks.push({
          pct,
          label:
            val >= 1000
              ? `${(val / 1000).toLocaleString('pl-PL')}k`
              : val < 1
              ? val.toLocaleString('pl-PL')
              : String(val),
        });
      }
    }
    return ticks;
  }, [scaleMode, logMin, logMax, maxVal, minVal]);

  const budgetPct =
    meta.dailyBudget15C !== undefined ? computeWidthPct(meta.dailyBudget15C) : null;

  return (
    <section id="skala-rzedow" className="section-block" aria-labelledby="scale-heading">
      <div className="section-header">
        <div>
          <h2 id="scale-heading" className="section-heading">
            Jedna skala rzędów wielkości — {meta.shortLabel}
          </h2>
          <p className="section-lead">
            {meta.description} Przełącz między skalą logarytmiczną (10ⁿ) a liniową (1:1), aby
            zobaczyć, jak mniejsze działania znikają na tle głównych źródeł wpływu.
          </p>
        </div>

        <div className="segmented-control" role="group" aria-label="Tryb skali osi">
          <button
            type="button"
            className={`segmented-btn ${scaleMode === 'log' ? 'active' : ''}`}
            aria-pressed={scaleMode === 'log'}
            onClick={() => setScaleMode('log')}
          >
            Skala logarytmiczna (10ⁿ)
          </button>
          <button
            type="button"
            className={`segmented-btn ${scaleMode === 'linear' ? 'active' : ''}`}
            aria-pressed={scaleMode === 'linear'}
            onClick={() => setScaleMode('linear')}
          >
            Skala liniowa (1:1)
          </button>
        </div>
      </div>

      <div className="scale-controls-row">
        <div className="category-filter-row" role="group" aria-label="Filtr kategorii">
          <button
            type="button"
            className={`filter-chip ${category === 'all' ? 'active' : ''}`}
            aria-pressed={category === 'all'}
            onClick={() => setCategory('all')}
          >
            Wszystkie ({DECISIONS.length})
          </button>
          {(Object.keys(CATEGORY_LABELS) as DecisionCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`filter-chip ${category === cat ? 'active' : ''}`}
              aria-pressed={category === cat}
              onClick={() => setCategory(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {budgetPct !== null && (
          <div className="budget-inline-legend mono">
            <span className="budget-swatch" aria-hidden="true" />
            <span>Dzienny budżet 1,5°C: 6,3 kg CO₂e</span>
          </div>
        )}
      </div>

      {hasAssignedFromTable && (
        <div className="scale-active-banner" role="status" aria-live="polite">
          <span className="mono">
            Na wadze: <strong>{leftItem.shortLabel}</strong> vs{' '}
            <strong>{rightItem.shortLabel}</strong>
          </span>
          <button
            type="button"
            className="swap-inline-btn"
            onClick={() => scrollSmoothOrAuto(0)}
          >
            <ArrowUp size={12} aria-hidden="true" />
            <span>Wróć do wagi</span>
          </button>
        </div>
      )}

      <div className="scale-table">
        <div className="scale-axis-header">
          <span>Działanie / decyzja</span>
          <div className="scale-axis-ticks" aria-hidden="true">
            {axisTicks.map((t) => (
              <span
                key={t.label}
                className="scale-axis-tick-label"
                style={{ left: `${t.pct}%` }}
              >
                {t.label}
              </span>
            ))}
          </div>
          <span style={{ textAlign: 'right' }}>Wartość</span>
          <span style={{ textAlign: 'right' }}>Wstaw na wagę</span>
        </div>

        {items.map((item) => {
          const val = item.metrics[activeMetric];
          const isLeft = item.id === leftId;
          const isRight = item.id === rightId;
          const widthPct = computeWidthPct(val);

          return (
            <div
              key={item.id}
              className={`scale-row ${isLeft || isRight ? 'is-selected' : ''}`}
            >
              <div className="scale-row-label">
                <span className="scale-row-name">{item.name}</span>
                <span className="scale-row-unit">{item.unit}</span>
              </div>

              <div className="scale-bar-cell">
                <div className="scale-bar-bg">
                  {axisTicks.map((t) => (
                    <div
                      key={t.label}
                      className="scale-grid-tick"
                      style={{ left: `${t.pct}%` }}
                      aria-hidden="true"
                    />
                  ))}
                  <div
                    className="scale-bar-fill"
                    style={{ transform: `scaleX(${widthPct / 100})` }}
                  />
                  {budgetPct !== null && (
                    <div
                      className="scale-budget-marker"
                      style={{ left: `${budgetPct}%` }}
                      aria-hidden="true"
                    />
                  )}
                </div>
              </div>

              <div className="scale-value-cell tabular">
                {formatMetricValue(val, activeMetric)}
              </div>

              <div className="scale-actions-cell">
                <button
                  type="button"
                  className={`pan-assign-btn ${isLeft ? 'active' : ''}`}
                  aria-pressed={isLeft}
                  onClick={() => {
                    onAssignLeft(item.id);
                    setHasAssignedFromTable(true);
                  }}
                >
                  Szalka L
                </button>
                <button
                  type="button"
                  className={`pan-assign-btn ${isRight ? 'active' : ''}`}
                  aria-pressed={isRight}
                  onClick={() => {
                    onAssignRight(item.id);
                    setHasAssignedFromTable(true);
                  }}
                >
                  Szalka P
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
