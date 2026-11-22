import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowLeftRight,
  BookOpen,
  Check,
  ChevronDown,
  Download,
  ExternalLink,
  Link2,
} from 'lucide-react';
import {
  DECISIONS,
  DIET_PROFILES,
  DUEL_PRESETS,
  DietProfile,
  EU_BASELINE_DIET,
  METRICS,
  METRIC_ORDER,
  MetricKey,
  SOURCES,
  formatMetricValue,
  formatNumberPL,
  formatRatio,
  getDecisionById,
} from './data/evidence';
import { MetrologyBalance } from './components/MetrologyBalance';
import { SpecimenPickerModal } from './components/SpecimenPickerModal';
import { UnifiedScaleSection } from './components/UnifiedScaleSection';
import { VeganCumulativeSection } from './components/VeganCumulativeSection';
import { SourcesLedgerSection } from './components/SourcesLedgerSection';
import { downloadMetrologyShareCard } from './utils/exportShareCard';

const LEDGER_HORIZONS = [
  { label: '30 dni', days: 30 },
  { label: '1 rok', days: 365 },
  { label: '5 lat', days: 1825 },
];

const VALID_IDS = new Set(DECISIONS.map((d) => d.id));
const VALID_METRICS = new Set<MetricKey>(METRIC_ORDER);
const VALID_FREQS = new Set([1, 52, 365]);

function readInitialParams(): {
  left: string;
  right: string;
  metric: MetricKey;
  leftFreq: number;
  rightFreq: number;
} {
  if (typeof window === 'undefined') {
    return {
      left: 'parcel-pl',
      right: 'parcel-china-air',
      metric: 'co2',
      leftFreq: 1,
      rightFreq: 1,
    };
  }
  const params = new URLSearchParams(window.location.search);
  const l = params.get('l');
  const r = params.get('r');
  const m = params.get('m') as MetricKey | null;
  const lf = Number(params.get('lf'));
  const rf = Number(params.get('rf'));
  return {
    left: l && VALID_IDS.has(l) ? l : 'parcel-pl',
    right: r && VALID_IDS.has(r) ? r : 'parcel-china-air',
    metric: m && VALID_METRICS.has(m) ? m : 'co2',
    leftFreq: VALID_FREQS.has(lf) ? lf : 1,
    rightFreq: VALID_FREQS.has(rf) ? rf : 1,
  };
}

export function App() {
  const initial = useMemo(() => readInitialParams(), []);
  const [activeMetric, setActiveMetric] = useState<MetricKey>(initial.metric);
  const [leftId, setLeftId] = useState<string>(initial.left);
  const [rightId, setRightId] = useState<string>(initial.right);
  const [leftFreq, setLeftFreq] = useState<number>(initial.leftFreq);
  const [rightFreq, setRightFreq] = useState<number>(initial.rightFreq);
  const [isCounterbalanced, setIsCounterbalanced] = useState<boolean>(false);
  const [pickerSide, setPickerSide] = useState<'left' | 'right' | null>(null);
  const [selectedDietId, setSelectedDietId] = useState<DietProfile['id']>('vegan');
  const [veganDays, setVeganDays] = useState<number>(365);
  const [showMethodology, setShowMethodology] = useState<boolean>(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'error'>('idle');

  const sourceCount = useMemo(() => Object.keys(SOURCES).length, []);

  // Sync active comparison & habit frequencies with URL query params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('l', leftId);
    params.set('r', rightId);
    params.set('m', activeMetric);
    if (leftFreq > 1) params.set('lf', String(leftFreq));
    else params.delete('lf');
    if (rightFreq > 1) params.set('rf', String(rightFreq));
    else params.delete('rf');
    const nextUrl = `${window.location.pathname}?${params.toString()}${window.location.hash}`;
    window.history.replaceState(null, '', nextUrl);
  }, [leftId, rightId, activeMetric, leftFreq, rightFreq]);

  const handleSwap = useCallback(() => {
    setLeftId(rightId);
    setRightId(leftId);
    setLeftFreq(rightFreq);
    setRightFreq(leftFreq);
  }, [leftId, rightId, leftFreq, rightFreq]);

  // Keyboard accelerators: 1-4 switch metric, S swaps pans, B toggles counterbalance
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (pickerSide) return;
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
      else if (e.key.toLowerCase() === 's') handleSwap();
      else if (e.key.toLowerCase() === 'b') setIsCounterbalanced((prev) => !prev);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [handleSwap, pickerSide]);

  const leftItem = getDecisionById(leftId);
  const rightItem = getDecisionById(rightId);

  const activePreset = useMemo(
    () =>
      leftFreq === 1 && rightFreq === 1
        ? DUEL_PRESETS.find(
            (p) =>
              (p.leftId === leftId && p.rightId === rightId) ||
              (p.leftId === rightId && p.rightId === leftId),
          ) ?? null
        : null,
    [leftId, rightId, leftFreq, rightFreq],
  );

  const leftVal = leftItem.metrics[activeMetric] * leftFreq;
  const rightVal = rightItem.metrics[activeMetric] * rightFreq;
  const ratio = formatRatio(leftVal, rightVal);

  const heavierItem = ratio.heavier === 'left' ? leftItem : rightItem;
  const lighterItem = ratio.heavier === 'left' ? rightItem : leftItem;
  const heavierFreq = ratio.heavier === 'left' ? leftFreq : rightFreq;
  const lighterFreq = ratio.heavier === 'left' ? rightFreq : leftFreq;
  const heavierVal = ratio.heavier === 'left' ? leftVal : rightVal;
  const lighterVal = ratio.heavier === 'left' ? rightVal : leftVal;

  const contextCopy = useMemo(() => {
    if (ratio.heavier === 'equal') {
      return {
        text: `Obie szalki ważą identyczne obciążenie (${formatMetricValue(
          leftVal,
          activeMetric,
        )}). Wybierz inną decyzję lub częstotliwość nawyku, aby zmierzyć różnicę rzędów wielkości.`,
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
    const hPrefix = heavierFreq > 1 ? `${heavierFreq}× ` : '';
    const lPrefix = lighterFreq > 1 ? `${lighterFreq}× ` : '';
    return {
      text: `${hPrefix}${heavierItem.name} obciąża wymiar „${METRICS[activeMetric].shortLabel}” ok. ${factorStr}× mocniej niż ${lPrefix}${lighterItem.name} (${formatMetricValue(
        heavierVal,
        activeMetric,
      )} vs ${formatMetricValue(lighterVal, activeMetric)}). ${heavierItem.greenwashingNote}`,
      source: SOURCES[heavierItem.primarySourceId],
    };
  }, [
    activePreset,
    activeMetric,
    heavierItem,
    lighterItem,
    heavierFreq,
    lighterFreq,
    heavierVal,
    lighterVal,
    leftItem,
    leftVal,
    ratio,
  ]);

  const veganDiet =
    DIET_PROFILES.find((d) => d.id === 'vegan') ?? DIET_PROFILES[3];

  const veganCo2 = (EU_BASELINE_DIET.daily.co2 - veganDiet.daily.co2) * veganDays;
  const veganWater = (EU_BASELINE_DIET.daily.water - veganDiet.daily.water) * veganDays;
  const veganLand = (EU_BASELINE_DIET.daily.land - veganDiet.daily.land) * veganDays;

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
    setLeftFreq(1);
    setRightFreq(1);
    setActiveMetric(preset.metric);
    setIsCounterbalanced(false);
  };

  const handleCopyShareLink = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard API unavailable');
      await navigator.clipboard.writeText(window.location.href);
      setCopyState('copied');
      window.setTimeout(() => setCopyState('idle'), 2200);
    } catch {
      setCopyState('error');
      window.setTimeout(() => setCopyState('idle'), 2600);
    }
  };

  const handleDownloadPng = () => {
    downloadMetrologyShareCard({
      leftItem,
      rightItem,
      leftFreq,
      rightFreq,
      activeMetric,
      verdictText: contextCopy.text,
    });
  };

  return (
    <div>
      <a href="#top" className="skip-link">
        Przejdź do instrumentu SKALA
      </a>

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
              <span>Źródła ({sourceCount})</span>
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
            leftFreq={leftFreq}
            rightFreq={rightFreq}
            activeMetric={activeMetric}
            isCounterbalanced={isCounterbalanced}
            onChangeMetric={setActiveMetric}
            onToggleCounterbalance={() => setIsCounterbalanced((prev) => !prev)}
            onOpenPicker={setPickerSide}
            onChangeLeftFreq={(f) => {
              setLeftFreq(f);
              setIsCounterbalanced(false);
            }}
            onChangeRightFreq={(f) => {
              setRightFreq(f);
              setIsCounterbalanced(false);
            }}
            onSwap={handleSwap}
          />

          {/* Equal-Edged Instrument Preset Strip & Utility Bar */}
          <div className="preset-deck">
            <div className="preset-deck-header">
              <span className="mono preset-deck-label">
                ZESTAWIENIA KONTROLNE · MIT VS SKALA
              </span>
              <div className="preset-deck-utils">
                <button
                  type="button"
                  className="swap-inline-btn hide-on-mobile"
                  onClick={handleSwap}
                >
                  <ArrowLeftRight size={13} aria-hidden="true" />
                  <span>Zamień (S)</span>
                </button>
                <button
                  type="button"
                  className="swap-inline-btn"
                  onClick={handleCopyShareLink}
                >
                  {copyState === 'copied' ? (
                    <>
                      <Check size={13} aria-hidden="true" />
                      <span>Skopiowano link!</span>
                    </>
                  ) : copyState === 'error' ? (
                    <>
                      <Link2 size={13} aria-hidden="true" />
                      <span>Skopiuj z paska URL</span>
                    </>
                  ) : (
                    <>
                      <Link2 size={13} aria-hidden="true" />
                      <span>Kopiuj link</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="swap-inline-btn"
                  onClick={handleDownloadPng}
                >
                  <Download size={13} aria-hidden="true" />
                  <span>Karta PNG</span>
                </button>
                <a href="#skala-rzedow" className="swap-inline-btn swap-inline-link">
                  <ArrowDown size={13} aria-hidden="true" />
                  <span>Skala ({DECISIONS.length})</span>
                </a>
              </div>
            </div>

            <div className="preset-strip-shell">
              <div
                className="preset-strip"
                role="group"
                aria-label="Gotowe zestawienia kontrolne"
              >
                {DUEL_PRESETS.map((preset, idx) => {
                  const isCurrent =
                    activePreset?.id === preset.id && activeMetric === preset.metric;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      className={`preset-cell ${isCurrent ? 'active' : ''}`}
                      aria-pressed={isCurrent}
                      onClick={() => handleSelectPreset(preset.id)}
                    >
                      <span className="preset-cell-meta mono">
                        <span>{String(idx + 1).padStart(2, '0')}</span>
                        <span>{METRICS[preset.metric].label}</span>
                      </span>
                      <span className="preset-cell-title">{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* SPLIT BOTTOM CALIBRATION LEDGER */}
        <section
          className="calibration-ledger"
          aria-label="Werdykt etyczny i kumulacja diety wegańskiej"
        >
          <div className="calibration-ledger-inner">
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

            <div className="ledger-cell">
              <h2 className="ledger-title">
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
              </h2>

              <div className="copper-bar-track" aria-hidden="true">
                <div
                  className="copper-bar-fill"
                  style={{ transform: `scaleX(${ledgerBarPct / 100})` }}
                />
              </div>

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

          {showMethodology && (
            <div className="methodology-drawer">
              <div className="methodology-drawer-inner">
                <div className="methodology-col">
                  <div className="methodology-col-head">
                    <strong>Szalka L: {leftItem.name}</strong>
                    <span className="mono">{leftItem.unit}</span>
                  </div>
                  <p className="methodology-text">
                    <strong>Założenia LCA (ocena cyklu życia):</strong> {leftItem.assumptions}
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
                    <strong>Założenia LCA (ocena cyklu życia):</strong> {rightItem.assumptions}
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

        {/* SECTION 3: DEEP-DIVE DIET CUMULATIVE IMPACT (DARK GRAPHITE BAND) */}
        <VeganCumulativeSection
          selectedDietId={selectedDietId}
          days={veganDays}
          onChangeDiet={setSelectedDietId}
          onChangeDays={setVeganDays}
        />

        {/* SECTION 4: FULL SCIENTIFIC BIBLIOGRAPHY */}
        <SourcesLedgerSection />
      </main>

      <footer className="site-footer">
        <span>SKALA · INSTRUMENT METROLOGICZNY WPŁYWU ŚRODOWISKOWEGO I ETYKI</span>
        <span>
          Skróty: 1–4 wymiary · S zamień · B wyrównaj wagę · LCA = Life Cycle Assessment
        </span>
      </footer>

      {/* Custom Engraved Specimen Picker Modal */}
      {pickerSide && (
        <SpecimenPickerModal
          side={pickerSide}
          currentId={pickerSide === 'left' ? leftId : rightId}
          otherId={pickerSide === 'left' ? rightId : leftId}
          activeMetric={activeMetric}
          onSelect={(id) => {
            if (pickerSide === 'left') handleSelectLeft(id);
            else handleSelectRight(id);
          }}
          onClose={() => setPickerSide(null)}
        />
      )}
    </div>
  );
}

export default App;
