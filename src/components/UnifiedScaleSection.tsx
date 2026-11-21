import React, { useMemo, useState } from 'react';
import {
  CATEGORY_LABELS,
  DECISIONS,
  DecisionCategory,
  METRICS,
  MetricKey,
  formatMetricValue,
} from '../data/evidence';

interface UnifiedScaleSectionProps {
  activeMetric: MetricKey;
  leftId: string;
  rightId: string;
  onAssignLeft: (id: string) => void;
  onAssignRight: (id: string) => void;
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

  const meta = METRICS[activeMetric];

  const items = useMemo(() => {
    const filtered =
      category === 'all'
        ? DECISIONS
        : DECISIONS.filter((d) => d.category === category);
    return [...filtered].sort(
      (a, b) => a.metrics[activeMetric] - b.metrics[activeMetric],
    );
  }, [activeMetric, category]);

  const { minVal, maxVal } = useMemo(() => {
    const values = DECISIONS.map((d) => d.metrics[activeMetric]);
    return {
      minVal: Math.min(...values),
      maxVal: Math.max(...values),
    };
  }, [activeMetric]);

  const computeWidthPct = (val: number): number => {
    if (scaleMode === 'linear') {
      return Math.max(0.4, (val / maxVal) * 100);
    }
    const logMin = Math.log10(Math.max(minVal, 1e-4) * 0.5);
    const logMax = Math.log10(maxVal * 1.15);
    const pct = ((Math.log10(Math.max(val, 1e-4)) - logMin) / (logMax - logMin)) * 100;
    return Math.max(2, Math.min(100, pct));
  };

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
            {meta.description} Przełącz między skalą logarytmiczną a liniową, aby poczuć
            rzeczywistą przepaść między decyzjami z pozoru „podobnego kalibru”.
          </p>
        </div>

        <div className="segmented-control" role="group" aria-label="Tryb skali osi">
          <button
            type="button"
            className={`segmented-btn ${scaleMode === 'log' ? 'active' : ''}`}
            onClick={() => setScaleMode('log')}
          >
            Skala logarytmiczna
          </button>
          <button
            type="button"
            className={`segmented-btn ${scaleMode === 'linear' ? 'active' : ''}`}
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
            onClick={() => setCategory('all')}
          >
            Wszystkie ({DECISIONS.length})
          </button>
          {(Object.keys(CATEGORY_LABELS) as DecisionCategory[]).map((cat) => (
            <button
              key={cat}
              type="button"
              className={`filter-chip ${category === cat ? 'active' : ''}`}
              onClick={() => setCategory(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        {budgetPct !== null && (
          <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--copper)' }}>
            | Pionowa linia miedziana = dzienny budżet 1,5°C (6,3 kg CO₂e)
          </div>
        )}
      </div>

      <div className="scale-table">
        <div className="scale-axis-header">
          <span>Działanie / decyzja</span>
          <span>
            Proporcja na skali ({scaleMode === 'log' ? 'rzędy wielkości 10ⁿ' : 'proporcja liniowa 1:1'})
          </span>
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
                  <div
                    className="scale-bar-fill"
                    style={{ transform: `scaleX(${widthPct / 100})` }}
                  />
                  {budgetPct !== null && (
                    <div
                      className="scale-budget-marker"
                      style={{ left: `${budgetPct}%` }}
                      title="Dzienny budżet 1,5°C: 6,3 kg CO₂e"
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
                  onClick={() => {
                    onAssignLeft(item.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  title="Połóż na lewej szalce wagi"
                >
                  Szalka L
                </button>
                <button
                  type="button"
                  className={`pan-assign-btn ${isRight ? 'active' : ''}`}
                  onClick={() => {
                    onAssignRight(item.id);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  title="Połóż na prawej szalce wagi"
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
