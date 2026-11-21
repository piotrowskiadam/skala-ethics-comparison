import { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowLeftRight,
  BookOpen,
  Check,
  ChevronDown,
  ExternalLink,
  Link2,
} from 'lucide-react';
import {
  DECISIONS,
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

const VALID_IDS = new Set(DECISIONS.map((d) => d.id));
const VALID_METRICS = new Set<MetricKey>(METRIC_ORDER);

function readInitialParams(): { left: string; right: string; metric: MetricKey } {
  if (typeof window === 'undefined') {
    return { left: 'parcel-pl', right: 'parcel-china-air', metric: 'co2' };
  }
  const params = new URLSearchParams(window.location.search);
  const l = params.get('l');
  const r = params.get('r');
  const m = params.get('m') as MetricKey | null;
  return {
    left: l && VALID_IDS.has(l) ? l : 'parcel-pl',
    right: r && VALID_IDS.has(r) ? r : 'parcel-china-air',
    metric: m && VALID_METRICS.has(m) ? m : 'co2',
  };
}

export function App() {
  const initial = useMemo(() => readInitialParams(), []);
  const [activeMetric, setActiveMetric] = useState<MetricKey>(initial.metric);
  const [leftId, setLeftId] = useState<string>(initial.left);
  const [rightId, setRightId] = useState<string>(initial.right);
  const [isCounterbalanced, setIsCounterbalanced] = useState<boolean>(false);
  const [veganBaselineId, setVeganBaselineId] =
    useState<DietBaseline['id']>('medium-meat');
  const [veganDays, setVeganDays] = useState<number>(365);
  const [showMethodology, setShowMethodology] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Sync active comparison with URL query params for instant sharing
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('l', leftId);
    params.set('r', rightId);
    params.set('m', activeMetric);
    const nextUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    window.history.replaceState(null, '', nextUrl);
  }, [leftId, rightId, activeMetric]);

  // Keyboard accelerators: 1-4 switch metric, S swaps pans, B toggles counterbalance
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'SELECT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === '1') setActiveMetric('co2');
      else if (e.key === '2') setActiveMetric('water');
      else if (e.key === '3') setActiveMetric('land');
      else if (e.key === '4') setActiveMetric('energy');
      else if (e.key.toLowerCase() === 's') {
        setLeftId((prevL) => {
          setRightId(prevL);
          return rightId;
        });
      } else if (e.key.toLowerCase() === 'b') {
        setIsCounterbalanced((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [rightId]);

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
    if (leftItem.id === rightItem.id || ratio.heavier === 'equal') {
      return {
        text: `Obie szalki ważą identyczne obciążenie (${formatMetricValue(
          leftItem.metrics[activeMetric],
          activeMetric,
        )}). Wybierz inną decyzję na jednej z szalek lub kliknij gotowy pojedynek, aby zmierzyć różnicę rzędów wielkości.`,
        source: SOURCES[leftItem.primarySourceId],
      };
    }
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
  }, [activePreset, activeMetric, heavierItem, lighterItem, leftItem, rightItem, ratio]);

  const veganBaseline =
    VEGAN_BASELINES.find((b) => b.id === veganBaselineId) ?? VEGAN_BASELINES[0];

  const veganCo2 = veganBaseline.dailySaved.co2 * veganDays;
  const veganWater = veganBaseline.dailySaved.water * veganDays;
  const veganLand = veganBaseline.dailySaved.land * veganDays;

  // Logarithmic time bar (7d -> 10y) matching the calibrated time ticks below
  const ledgerBarPct = Math.max(
    6,
    Math.min(
      100,
      ((Math.log10(Math.max(veganDays, 7)) - Math.log10(7)) /
        (Math.log10(3650) - Math.log10(7))) *
        100,
    ),
  );

  const handleSelectLeft = (id: string) => {
    setLeftId(id);
    setIsCounterbalanced(false);
  };

  const handleSelectRight = (id: string) => {
    setRightId(id);
    setIsCounterbalanced(false);
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = DUEL_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setLeftId(preset.leftId);
    setRightId(preset.rightId);
    setActiveMetric(preset.metric);
    setIsCounterbalanced(false);
  };

  const handleSwap = () => {
    setLeftId(rightId);
    setRightId(leftId);
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      // Fallback if clipboard API unavailable
      setCopiedLink(true);
      window.setTimeout(() => setCopiedLink(false), 2200);
    }
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
              <BookOpen size={14} strokeWidth={2} aria-hidden="true" />
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
            isCounterbalanced={isCounterbalanced}
            onToggleCounterbalance={() => setIsCounterbalanced((prev) => !prev)}
            onSelectLeft={handleSelectLeft}
            onSelectRight={handleSelectRight}
            onSwap={handleSwap}
          />

          {/* Quick-Swap Greenwashing Duels & Instrument Controls */}
          <div className="vernier-rail-section">
            <div
              className="specimen-rail"
              role="group"
              aria-label="Gotowe pojedynki greenwashingowe"
            >
              {DUEL_PRESETS.map((preset) => {
                const isCurrent =
                  activePreset?.id === preset.id && activeMetric === preset.metric;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    className={`specimen-pill ${isCurrent ? 'active' : ''}`}
                    aria-pressed={isCurrent}
                    onClick={() => handleSelectPreset(preset.id)}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>

            <div className="specimen-rail-hint">
              <button type="button" className="swap-inline-btn" onClick={handleSwap}>
                <ArrowLeftRight size={13} aria-hidden="true" />
                <span>Zamień szalki (S)</span>
              </button>
              <button
                type="button"
                className="swap-inline-btn"
                onClick={handleCopyShareLink}
              >
                {copiedLink ? (
                  <>
                    <Check size={13} aria-hidden="true" />
                    <span>Skopiowano link!</span>
                  </>
                ) : (
                  <>
                    <Link2 size={13} aria-hidden="true" />
                    <span>Kopiuj link do pojedynku</span>
                  </>
                )}
              </button>
              <a
                href="#skala-rzedow"
                className="swap-inline-btn swap-inline-link"
              >
                <ArrowDown size={13} aria-hidden="true" />
                <span>Pełna skala 16 decyzji</span>
              </a>
            </div>
          </div>
        </section>

        {/* SPLIT BOTTOM CALIBRATION LEDGER */}
        <section
          className="calibration-ledger"
          aria-label="Werdykt etyczny i kumulacja diety wegańskiej"
        >
          <div className="calibration-ledger-inner">
            {/* Left Cell: Ethical & Greenwashing Context */}
            <div className="ledger-cell" aria-live="polite">
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
                  aria-label={`Zweryfikowano ${contextCopy.source.shortBadge} — otwórz publikację w nowej karcie`}
                >
                  <span>Zweryfikowano · {contextCopy.source.shortBadge}</span>
                  <ExternalLink size={11} aria-hidden="true" />
                </a>
                <button
                  type="button"
                  className="methodology-toggle-btn mono"
                  aria-expanded={showMethodology}
                  onClick={() => setShowMethodology((prev) => !prev)}
                >
                  <span>Założenia metodologiczne i etyka</span>
                  <ChevronDown
                    size={13}
                    aria-hidden="true"
                    className={`chevron-icon ${showMethodology ? 'open' : ''}`}
                  />
                </button>
              </div>
            </div>

            {/* Right Cell: Cumulative Vegan Diet Bar with True Time Scale */}
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
                      aria-pressed={veganDays === h.days}
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

              {/* Calibrated Logarithmic Time Scale under Copper Bar (7d -> 10y) */}
              <div className="time-scale-ticks mono" aria-hidden="true">
                <span>7 dni</span>
                <span>30 dni</span>
                <span>1 rok</span>
                <span>5 lat</span>
                <span>10 lat</span>
              </div>

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

          {/* Expandable Methodological Assumptions & Ethical Context for BOTH Pans */}
          {showMethodology && (
            <div className="methodology-drawer">
              <div className="methodology-drawer-inner">
                <div className="methodology-col">
                  <div className="methodology-col-head">
                    <strong>Szalka L: {leftItem.name}</strong>
                    <span className="mono">{leftItem.unit}</span>
                  </div>
                  <p className="methodology-text">
                    <strong>Założenia LCA:</strong> {leftItem.assumptions}
                  </p>
                  <p className="methodology-text">
                    <strong>Kontekst etyczny:</strong> {leftItem.ethicalContext}
                  </p>
                </div>

                <div className="methodology-col">
                  <div className="methodology-col-head">
                    <strong>Szalka P: {rightItem.name}</strong>
                    <span className="mono">{rightItem.unit}</span>
                  </div>
                  <p className="methodology-text">
                    <strong>Założenia LCA:</strong> {rightItem.assumptions}
                  </p>
                  <p className="methodology-text">
                    <strong>Kontekst etyczny:</strong> {rightItem.ethicalContext}
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 2: UNIFIED ORDER-OF-MAGNITUDE SCALE */}
        <UnifiedScaleSection
          activeMetric={activeMetric}
          leftId={leftId}
          rightId={rightId}
          onAssignLeft={handleSelectLeft}
          onAssignRight={handleSelectRight}
        />

        {/* SECTION 3: DEEP-DIVE VEGAN DIET CUMULATIVE IMPACT */}
        <VeganCumulativeSection
          baselineId={veganBaselineId}
          days={veganDays}
          onChangeBaseline={setVeganBaselineId}
          onChangeDays={setVeganDays}
        />

        {/* SECTION 4: FULL SCIENTIFIC BIBLIOGRAPHY */}
        <SourcesLedgerSection />
      </main>

      <footer className="site-footer">
        <span>SKALA · INSTRUMENT METROLOGICZNY WPŁYWU ŚRODOWISKOWEGO I ETYKI</span>
        <span>
          Skróty klawiszowe: 1–4 wymiary · S zamień szalki · B wyrównaj wagę · Dane LCA
          2011–2025
        </span>
      </footer>
    </div>
  );
}

export default App;
