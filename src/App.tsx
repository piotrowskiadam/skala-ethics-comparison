import { useCallback, useEffect, useMemo, useState } from 'react';
import {
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
  DUEL_PRESETS,
  DietProfile,
  METRICS,
  METRIC_ORDER,
  MetricKey,
  SOURCES,
  formatMetricValue,
  formatRatio,
  getDecisionById,
} from './data/evidence';
import { MetrologyBalance } from './components/MetrologyBalance';
import { SpecimenPickerModal } from './components/SpecimenPickerModal';
import { UnifiedScaleSection } from './components/UnifiedScaleSection';
import { VeganCumulativeSection } from './components/VeganCumulativeSection';
import { SourcesLedgerSection } from './components/SourcesLedgerSection';
import { downloadMetrologyShareCard } from './utils/exportShareCard';

const VALID_IDS = new Set(DECISIONS.map((d) => d.id));
const VALID_METRICS = new Set<MetricKey>(METRIC_ORDER);
const VALID_FREQS = new Set([1, 52, 365]);

const HERO_STORIES = [
  {
    presetId: 'pl-vs-china',
    eyebrow: '32,6× więcej CO₂e',
    title: 'Paczka z Chin vs magazyn w PL',
    sub: 'Fracht lotniczy kontra logistyka lądowa',
  },
  {
    presetId: 'ai-vs-beef-water',
    eyebrow: '1 733× więcej wody',
    title: '100 promptów AI vs stek wołowy',
    sub: 'Mit wodny AI zestawiony z jednym obiadem',
  },
  {
    presetId: 'vegan-year-vs-sad',
    eyebrow: '4,1× mniej CO₂e',
    title: '1 rok: weganizm vs dieta mięsna',
    sub: 'Kumulacja codziennych wyborów przez rok',
  },
];

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

function scrollElIntoViewRespectingMotion(el: HTMLElement | null) {
  if (!el) return;
  const reduced =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  el.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });
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

  const handleSelectLeft = (id: string) => {
    setLeftId(id);
    setIsCounterbalanced(false);
  };

  const handleSelectRight = (id: string) => {
    setRightId(id);
    setIsCounterbalanced(false);
  };

  const handleSelectPreset = (presetId: string, scrollToBalance = false) => {
    const preset = DUEL_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setLeftId(preset.leftId);
    setRightId(preset.rightId);
    setLeftFreq(1);
    setRightFreq(1);
    setActiveMetric(preset.metric);
    setIsCounterbalanced(false);
    if (scrollToBalance) {
      scrollElIntoViewRespectingMotion(document.getElementById('waga'));
    }
  };

  const handleToggleCounterbalance = () => {
    setIsCounterbalanced((prev) => {
      const next = !prev;
      if (next) {
        window.setTimeout(() => {
          const chamber = document.getElementById('komora-odwaznikow');
          if (chamber) {
            const rect = chamber.getBoundingClientRect();
            if (rect.top > window.innerHeight * 0.78) {
              scrollElIntoViewRespectingMotion(chamber);
            }
          }
        }, 80);
      }
      return next;
    });
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
      <a href="#waga" className="skip-link">
        Przejdź do wagi metrologicznej
      </a>

      {/* STICKY INSTRUMENT BAR WITH LIVE 4-LENS RATIOS */}
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
              const tabRatio = formatRatio(
                leftItem.metrics[key] * leftFreq,
                rightItem.metrics[key] * rightFreq,
              );
              return (
                <button
                  key={key}
                  type="button"
                  className={`metric-tab ${isActive ? 'active' : ''}`}
                  aria-pressed={isActive}
                  onClick={() => setActiveMetric(key)}
                >
                  <span>{m.label}</span>
                  <span className="tab-ratio-badge mono">{tabRatio.label}</span>
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
        {/* ACT I: CLEAN, WELCOMING EDITORIAL LANDING HERO (ZERO TABELKOZA) */}
        <section className="landing-hero" aria-label="Wprowadzenie do instrumentu SKALA">
          <div className="landing-hero-inner">
            <div className="landing-hero-copy">
              <h1 className="landing-headline">
                Ile naprawdę ważą Twoje codzienne decyzje?
              </h1>
              <p className="landing-subhead">
                Jedna fizyczna skala zamiast greenwashingu. Zważ na żywo wpływ codziennych
                wyborów na klimat, wodę, glebę i energię — każda liczba pochodzi ze
                zweryfikowanych badań LCA.
              </p>
            </div>

            <div className="hero-stories-grid" role="group" aria-label="Najciekawsze zestawienia na start">
              {HERO_STORIES.map((story) => {
                const isSelected = activePreset?.id === story.presetId;
                return (
                  <button
                    key={story.presetId}
                    type="button"
                    className={`hero-story-card ${isSelected ? 'active' : ''}`}
                    aria-pressed={isSelected}
                    onClick={() => handleSelectPreset(story.presetId, true)}
                  >
                    <span className="hero-story-stat mono">{story.eyebrow}</span>
                    <strong className="hero-story-title">{story.title}</strong>
                    <span className="hero-story-sub">{story.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ACT II: INTERACTIVE PRECISION BALANCE INSTRUMENT */}
        <section
          id="waga"
          className="balance-stage"
          aria-label="Interaktywna waga metrologiczna"
        >
          <MetrologyBalance
            leftItem={leftItem}
            rightItem={rightItem}
            leftFreq={leftFreq}
            rightFreq={rightFreq}
            activeMetric={activeMetric}
            isCounterbalanced={isCounterbalanced}
            onToggleCounterbalance={handleToggleCounterbalance}
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
        </section>

        {/* FOCUSED VERDICT BAND (SINGLE CLEAR TAKEAWAY + SHARE + ASSUMPTIONS) */}
        <section className="verdict-band" aria-label="Werdykt etyczny i założenia metodologiczne">
          <div className="verdict-band-inner">
            <div className="verdict-main">
              <p className="verdict-body">{contextCopy.text}</p>
              <div className="verdict-actions-row">
                <a
                  href={contextCopy.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-pill"
                  aria-label={`Zweryfikowano ${contextCopy.source.shortBadge} — otwórz publikację w nowej karcie`}
                >
                  <span>Źródło · {contextCopy.source.shortBadge}</span>
                  <ExternalLink size={11} aria-hidden="true" />
                </a>

                <button
                  type="button"
                  className="methodology-toggle-btn mono"
                  aria-expanded={showMethodology}
                  onClick={() => setShowMethodology((prev) => !prev)}
                >
                  <span>Założenia LCA i etyka</span>
                  <ChevronDown
                    size={13}
                    aria-hidden="true"
                    className={`chevron-icon ${showMethodology ? 'open' : ''}`}
                  />
                </button>

                <div className="verdict-share-group">
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
                        <span>Skopiowano!</span>
                      </>
                    ) : copyState === 'error' ? (
                      <>
                        <Link2 size={13} aria-hidden="true" />
                        <span>Skopiuj z paska URL</span>
                      </>
                    ) : (
                      <>
                        <Link2 size={13} aria-hidden="true" />
                        <span>Link</span>
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
                </div>
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

        {/* ACT III: DARK GRAPHITE DIET CUMULATIVE IMPACT (INSTANT CAUSE -> EFFECT) */}
        <VeganCumulativeSection
          selectedDietId={selectedDietId}
          days={veganDays}
          onChangeDiet={setSelectedDietId}
          onChangeDays={setVeganDays}
        />

        {/* ACT IV: VISUAL ORDER-OF-MAGNITUDE SCALE (8 ICONIC ITEMS + EXPAND) */}
        <UnifiedScaleSection
          activeMetric={activeMetric}
          leftId={leftId}
          rightId={rightId}
          onAssignLeft={handleSelectLeft}
          onAssignRight={handleSelectRight}
        />

        {/* ACT V: SCIENTIFIC BIBLIOGRAPHY */}
        <SourcesLedgerSection />
      </main>

      <footer className="site-footer">
        <span>SKALA · INSTRUMENT METROLOGICZNY WPŁYWU ŚRODOWISKOWEGO I ETYKI</span>
        <span>
          Skróty: 1–4 wymiary · S zamień · B wyrównaj wagę · LCA = Life Cycle Assessment
        </span>
      </footer>

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
