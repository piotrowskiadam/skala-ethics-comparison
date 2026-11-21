import { useMemo, useState } from 'react';
import { ArrowDown, ArrowLeftRight, BookOpen, ExternalLink } from 'lucide-react';
import {
  DUEL_PRESETS,
  DietBaseline,
  METRICS,
  METRIC_ORDER,
  MetricKey,
  SOURCES,
  VEGAN_BASELINES,
  formatMetricValue,
  formatNumberPL,
  formatRatio,
  getDecisionById,
} from './data/evidence';
import { MetrologyBalance } from './components/MetrologyBalance';
import { UnifiedScaleSection } from './components/UnifiedScaleSection';
import { VeganCumulativeSection } from './components/VeganCumulativeSection';
import { SourcesLedgerSection } from './components/SourcesLedgerSection';

const LEDGER_HORIZONS = [
  { label: '30 dni', days: 30 },
  { label: '1 rok', days: 365 },
  { label: '5 lat', days: 1825 },
];

export function App() {
  const [activeMetric, setActiveMetric] = useState<MetricKey>('co2');
  const [leftId, setLeftId] = useState<string>('parcel-pl');
  const [rightId, setRightId] = useState<string>('parcel-china-air');
  const [veganBaselineId, setVeganBaselineId] =
    useState<DietBaseline['id']>('medium-meat');
  const [veganDays, setVeganDays] = useState<number>(365);
  const [highlightedSourceId, setHighlightedSourceId] = useState<string | null>(null);

  const leftItem = getDecisionById(leftId);
  const rightItem = getDecisionById(rightId);

  const activePreset = useMemo(
    () =>
      DUEL_PRESETS.find(
        (p) =>
          (p.leftId === leftId && p.rightId === rightId) ||
          (p.leftId === rightId && p.rightId === leftId),
      ) ?? null,
    [leftId, rightId],
  );

  const ratio = formatRatio(
    leftItem.metrics[activeMetric],
    rightItem.metrics[activeMetric],
  );

  const heavierItem = ratio.heavier === 'left' ? leftItem : rightItem;
  const lighterItem = ratio.heavier === 'left' ? rightItem : leftItem;

  const contextCopy = useMemo(() => {
    if (activePreset && activePreset.metric === activeMetric) {
      return {
        text: activePreset.verdictBody,
        source: SOURCES[activePreset.verifiedSourceId],
      };
    }
    const factorStr =
      ratio.factor >= 100
        ? Math.round(ratio.factor).toLocaleString('pl-PL')
        : ratio.factor.toLocaleString('pl-PL', { maximumFractionDigits: 1 });
    return {
      text: `${heavierItem.name} obciąża wymiar „${METRICS[activeMetric].shortLabel}” ok. ${factorStr}× mocniej niż ${lighterItem.name} (${formatMetricValue(
        heavierItem.metrics[activeMetric],
        activeMetric,
      )} vs ${formatMetricValue(
        lighterItem.metrics[activeMetric],
        activeMetric,
      )}). ${heavierItem.greenwashingNote}`,
      source: SOURCES[heavierItem.primarySourceId],
    };
  }, [activePreset, activeMetric, heavierItem, lighterItem, ratio.factor]);

  const veganBaseline =
    VEGAN_BASELINES.find((b) => b.id === veganBaselineId) ?? VEGAN_BASELINES[0];

  const veganCo2 = veganBaseline.dailySaved.co2 * veganDays;
  const veganWater = veganBaseline.dailySaved.water * veganDays;
  const veganLand = veganBaseline.dailySaved.land * veganDays;

  // Bar fill relative to a 5-year reference scale (or smoothly clamped 14%–95%)
  const ledgerBarPct = Math.max(
    14,
    Math.min(96, (Math.log10(veganDays) / Math.log10(3650)) * 96),
  );

  const handleSelectPreset = (presetId: string) => {
    const preset = DUEL_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setLeftId(preset.leftId);
    setRightId(preset.rightId);
    setActiveMetric(preset.metric);
  };

  const handleSwap = () => {
    setLeftId(rightId);
    setRightId(leftId);
  };

  const handleInspectSource = (sourceId: string) => {
    setHighlightedSourceId(sourceId);
    const el = document.getElementById(`source-${sourceId}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <div>
      {/* TOP INSTRUMENT BAR */}
      <header className="top-bar">
        <div className="top-bar-inner">
          <a href="#top" className="brand-lockup" aria-label="SKALA — powrót na górę">
            <span className="brand-wordmark">SKALA</span>
            <span className="brand-slash" aria-hidden="true">
              /
            </span>
            <span className="brand-instrument">INSTRUMENT METROLOGICZNY</span>
          </a>

          <nav className="metric-tabs" aria-label="Wymiar fizyczny pomiaru">
            {METRIC_ORDER.map((key) => {
              const m = METRICS[key];
              const isActive = activeMetric === key;
              return (
                <button
                  key={key}
                  type="button"
                  className={`metric-tab ${isActive ? 'active' : ''}`}
                  aria-pressed={isActive}
                  onClick={() => setActiveMetric(key)}
                >
                  {m.label}
                </button>
              );
            })}
          </nav>

          <div className="top-bar-actions">
            <a href="#baza-badan" className="outline-btn">
              <BookOpen size={14} strokeWidth={2} />
              <span>Baza badań LCA</span>
            </a>
          </div>
        </div>
      </header>

      <main id="top">
        {/* FIRST VIEWPORT: PRECISION BALANCE INSTRUMENT */}
        <section className="balance-stage" aria-label="Interaktywna waga metrologiczna">
          <MetrologyBalance
            leftItem={leftItem}
            rightItem={rightItem}
            activeMetric={activeMetric}
            onSelectLeft={setLeftId}
            onSelectRight={setRightId}
            onSwap={handleSwap}
            onInspectSource={handleInspectSource}
          />

          {/* Engraved Millimeter Vernier Ruler & Quick-Swap Duels */}
          <div className="vernier-rail-section">
            <svg
              className="vernier-ruler-svg"
              viewBox="0 0 820 18"
              aria-hidden="true"
            >
              {Array.from({ length: 101 }, (_, i) => {
                const x = 10 + i * 8;
                const isMajor = i % 10 === 0;
                const isMid = i % 5 === 0;
                const h = isMajor ? 14 : isMid ? 9 : 5;
                return (
                  <line
                    key={i}
                    x1={x}
                    y1={16 - h}
                    x2={x}
                    y2={16}
                    stroke="#141615"
                    strokeWidth={isMajor ? 1.25 : 0.75}
                    opacity={isMajor ? 0.75 : 0.4}
                  />
                );
              })}
            </svg>

            <div className="specimen-rail" role="group" aria-label="Gotowe pojedynki greenwashingowe">
              {DUEL_PRESETS.map((preset) => {
                const isCurrent = activePreset?.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`specimen-pill ${isCurrent ? 'active' : ''}`}
                    onClick={() => handleSelectPreset(preset.id)}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="specimen-rail-hint">
              <span>Wybierz gotowe zestawienie lub zmień dowolną decyzję bezpośrednio na szalce</span>
              <button
                type="button"
                className="swap-inline-btn"
                onClick={handleSwap}
              >
                <ArrowLeftRight size={12} />
                <span>Zamień szalki</span>
              </button>
              <a href="#skala-rzedow" className="swap-inline-btn" style={{ textDecoration: 'none' }}>
                <ArrowDown size={12} />
                <span>Pełna skala 16 decyzji</span>
              </a>
            </div>
          </div>
        </section>

        {/* SPLIT BOTTOM CALIBRATION LEDGER */}
        <section className="calibration-ledger" aria-label="Werdykt etyczny i kumulacja diety wegańskiej">
          <div className="calibration-ledger-inner">
            {/* Left Cell: Ethical & Greenwashing Context */}
            <div className="ledger-cell">
              <h2 className="ledger-title">
                <span>KONTEKST ETYCZNY I GREENWASHING</span>
              </h2>
              <p className="ledger-body">{contextCopy.text}</p>
              <div className="ledger-sources-row">
                <a
                  href={contextCopy.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-pill"
                >
                  <span>Zweryfikowano · {contextCopy.source.shortBadge}</span>
                  <ExternalLink size={11} />
                </a>
                <span className="mono" style={{ fontSize: '0.73rem', color: 'var(--ink-muted)' }}>
                  Założenia: {heavierItem.unit}
                </span>
              </div>
            </div>

            {/* Right Cell: Cumulative Vegan Diet Bar */}
            <div className="ledger-cell">
              <div className="ledger-title">
                <span>
                  KUMULACJA: DIETA WEGAŃSKA (
                  {veganDays === 365
                    ? '1 ROK'
                    : veganDays === 30
                    ? '30 DNI'
                    : veganDays === 1825
                    ? '5 LAT'
                    : `${veganDays} DNI`}
                  )
                </span>
                <div className="horizon-pills" role="group" aria-label="Szybki wybór okresu">
                  {LEDGER_HORIZONS.map((h) => (
                    <button
                      key={h.days}
                      type="button"
                      className={`horizon-pill ${veganDays === h.days ? 'active' : ''}`}
                      onClick={() => setVeganDays(h.days)}
                    >
                      {h.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="copper-bar-track" aria-hidden="true">
                <div
                  className="copper-bar-fill"
                  style={{ transform: `scaleX(${ledgerBarPct / 100})` }}
                />
              </div>

              {/* Calibrated Millimeter Scale under Copper Bar */}
              <svg className="vernier-ticks-row" viewBox="0 0 600 24" aria-hidden="true">
                {Array.from({ length: 76 }, (_, i) => {
                  const x = 4 + i * 7.89;
                  const isMajor = i % 10 === 0;
                  const isMid = i % 5 === 0;
                  const h = isMajor ? 14 : isMid ? 9 : 5;
                  return (
                    <line
                      key={i}
                      x1={x}
                      y1={1}
                      x2={x}
                      y2={1 + h}
                      stroke="#141615"
                      strokeWidth={isMajor ? 1.15 : 0.7}
                      opacity={isMajor ? 0.8 : 0.45}
                    />
                  );
                })}
                <text
                  x="4"
                  y="23"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9"
                  fill="#5A605C"
                >
                  mm
                </text>
                <text
                  x="596"
                  y="23"
                  textAnchor="end"
                  fontFamily="JetBrains Mono, monospace"
                  fontSize="9"
                  fill="#5A605C"
                >
                  mm
                </text>
              </svg>

              <div className="ledger-vegan-stats tabular">
                <span>
                  Zaoszczędzono: <strong>{formatNumberPL(veganCo2)} kg CO₂e</strong>
                </span>
                <span>
                  <strong>{formatNumberPL(veganWater)} L</strong> wody
                </span>
                <span>
                  <strong>{formatNumberPL(veganLand)} m²</strong> gleby
                </span>
                <a href="#kumulacja-weganska" className="ledger-vegan-link">
                  Pełny symulator →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: UNIFIED ORDER-OF-MAGNITUDE SCALE */}
        <UnifiedScaleSection
          activeMetric={activeMetric}
          leftId={leftId}
          rightId={rightId}
          onAssignLeft={setLeftId}
          onAssignRight={setRightId}
        />

        {/* SECTION 3: DEEP-DIVE VEGAN DIET CUMULATIVE IMPACT */}
        <VeganCumulativeSection
          baselineId={veganBaselineId}
          days={veganDays}
          onChangeBaseline={setVeganBaselineId}
          onChangeDays={setVeganDays}
        />

        {/* SECTION 4: FULL SCIENTIFIC BIBLIOGRAPHY */}
        <SourcesLedgerSection highlightedSourceId={highlightedSourceId} />
      </main>

      <footer className="site-footer">
        <span>SKALA · INSTRUMENT METROLOGICZNY WPŁYWU ŚRODOWISKOWEGO I ETYKI</span>
        <span>
          Wartości są uśrednionymi estymacjami LCA ze źródeł publicznych (2011–2025) i mogą
          różnić się lokalnie w zależności od miksu energetycznego i łańcucha dostaw.
        </span>
      </footer>
    </div>
  );
}

export default App;
