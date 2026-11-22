import React, { useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import {
  DIET_PROFILES,
  DietProfile,
  EU_BASELINE_DIET,
  SOURCES,
  formatNumberPL,
} from '../data/evidence';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

interface VeganCumulativeSectionProps {
  selectedDietId: DietProfile['id'];
  days: number;
  onChangeDiet: (id: DietProfile['id']) => void;
  onChangeDays: (days: number) => void;
}

const HORIZON_PRESETS = [
  { label: '7 dni', days: 7 },
  { label: '30 dni', days: 30 },
  { label: '1 rok', days: 365 },
  { label: '5 lat', days: 1825 },
  { label: '10 lat', days: 3650 },
];

function polishNoun(value: number, one: string, few: string, many: string, frac: string): string {
  if (!Number.isInteger(value)) return frac;
  const abs = Math.abs(value);
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (abs === 1) return one;
  if (mod10 >= 2 && mod10 <= 4 && !(mod100 >= 12 && mod100 <= 14)) return few;
  return many;
}

function formatDurationLabel(days: number): string {
  if (days < 30) return `${days} dni`;
  if (days < 365) {
    const months = Math.round((days / 30.4) * 10) / 10;
    return `${days} dni (ok. ${months.toLocaleString('pl-PL')} mies.)`;
  }
  const years = Math.round((days / 365) * 10) / 10;
  const noun = polishNoun(years, 'rok', 'lata', 'lat', 'roku');
  return `${years.toLocaleString('pl-PL')} ${noun} (${days.toLocaleString('pl-PL')} dni)`;
}

export const VeganCumulativeSection: React.FC<VeganCumulativeSectionProps> = ({
  selectedDietId,
  days,
  onChangeDiet,
  onChangeDays,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const selectedDiet =
    DIET_PROFILES.find((d) => d.id === selectedDietId) ?? DIET_PROFILES[3];
  const base = EU_BASELINE_DIET;

  const isBaseline = Boolean(selectedDiet.isBaseline);
  // Delta = selected - baseline: negative means SAVED (better than EU avg), positive means EXTRA BURDEN (worse than EU avg)
  const deltaCo2 = (selectedDiet.daily.co2 - base.daily.co2) * days;
  const deltaWater = (selectedDiet.daily.water - base.daily.water) * days;
  const deltaLand = (selectedDiet.daily.land - base.daily.land) * days;
  const deltaEutro = ((selectedDiet.daily.eutrophication - base.daily.eutrophication) * days) / 1000; // kg PO4e

  const totalCo2 = selectedDiet.daily.co2 * days;
  const totalWater = selectedDiet.daily.water * days;
  const totalLand = selectedDiet.daily.land * days;
  const totalEutro = (selectedDiet.daily.eutrophication * days) / 1000;

  const isSaving = deltaCo2 < -1e-6;
  const isWorse = deltaCo2 > 1e-6;

  // Display absolute total when EU baseline is chosen; signed delta otherwise
  const shownCo2 = isBaseline ? totalCo2 : Math.abs(deltaCo2);
  const shownWater = isBaseline ? totalWater : Math.abs(deltaWater);
  const shownLand = isBaseline ? totalLand : Math.abs(deltaLand);
  const shownEutro = isBaseline ? totalEutro : Math.abs(deltaEutro);

  const animCo2 = useAnimatedNumber(shownCo2, 320);
  const animWater = useAnimatedNumber(shownWater, 320);
  const animLand = useAnimatedNumber(shownLand, 320);
  const animEutro = useAnimatedNumber(shownEutro, 320);

  const signPrefix = isBaseline ? '' : isSaving ? '−' : '+';
  const toneClass = isBaseline ? 'is-neutral' : isSaving ? 'is-saving' : 'is-worse';

  const eqFlights = Math.round((shownCo2 / 395) * 10) / 10;
  const eqChinaParcels = Math.round(shownCo2 / 12.4);
  const eqShowers = Math.round(shownWater / 60);
  const eqFootballPitches = Math.round((shownLand / 7140) * 100) / 100;

  // Chart plots TOTAL cumulative CO2e of all 4 real diets over 7d -> 10y,
  // and shades the physical delta wedge between EU average (reference) and the selected diet!
  const maxDays = 3650;
  const maxCo2 = Math.max(...DIET_PROFILES.map((d) => d.daily.co2)) * maxDays;

  const svgW = 720;
  const svgH = 244;
  const padL = 52;
  const padR = 132;
  const padT = 22;
  const padB = 34;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const xOf = (d: number) => padL + (d / maxDays) * plotW;
  const yOf = (val: number) => padT + plotH - (val / maxCo2) * plotH;

  const updateDaysFromClientX = (clientX: number) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * svgW;
    const clamped = Math.max(padL, Math.min(padL + plotW, relX));
    const ratioX = (clamped - padL) / plotW;
    const nextDays = Math.max(7, Math.min(maxDays, Math.round(ratioX * maxDays)));
    onChangeDays(nextDays);
  };

  const activeX = xOf(days);
  const activeY = yOf(totalCo2);
  const baseYAtDays = yOf(base.daily.co2 * days);

  // Shaded wedge between reference EU average line and selected diet line
  const wedgePath = `M ${padL} ${padT + plotH} L ${activeX} ${activeY} L ${activeX} ${baseYAtDays} Z`;

  const activeColor = isBaseline ? '#ECEAE3' : isSaving ? '#5BB381' : '#E07A4F';
  const wedgeFill = isSaving
    ? 'rgba(91, 179, 129, 0.24)'
    : isWorse
    ? 'rgba(224, 122, 79, 0.26)'
    : 'transparent';

  const milestones = [
    { d: 365, label: '1 rok' },
    { d: 1095, label: '3 lata' },
    { d: 1825, label: '5 lat' },
    { d: 3650, label: '10 lat' },
  ];

  const scarborough = SOURCES['scarborough-2023'];
  const poore = SOURCES['poore-2018'];

  return (
    <div className="vegan-dark-band">
      <section
        id="kumulacja-weganska"
        className="section-block vegan-section-inner"
        aria-labelledby="vegan-heading"
      >
        <div className="section-header">
          <div>
            <h2 id="vegan-heading" className="section-heading">
              Jak wybór diety kumuluje się w czasie
            </h2>
            <p className="section-lead">
              Wszystkie diety zostały zestandaryzowane do <strong>2 000 kcal dziennie</strong>{' '}
              (Oxford / <em>Nature Food</em> 2023). Punktem odniesienia (0) jest{' '}
              <strong>średnia dieta europejska</strong> — wybierz dowolną dietę po lewej, aby
              zobaczyć, ile w skali lat <strong>oszczędzasz (−)</strong> albo o ile{' '}
              <strong>zwiększasz obciążenie (+)</strong>.
            </p>
          </div>

          <div className="ledger-sources-row">
            <a
              href={scarborough.url}
              target="_blank"
              rel="noopener noreferrer"
              className="source-pill"
              aria-label="Scarborough et al. Nature Food 2023 — otwórz publikację w nowej karcie"
            >
              <span>Scarborough et al. · Nature Food 2023</span>
              <ExternalLink size={11} aria-hidden="true" />
            </a>
            <a
              href={poore.url}
              target="_blank"
              rel="noopener noreferrer"
              className="source-pill"
              aria-label="Poore & Nemecek Science 2018 — otwórz publikację w nowej karcie"
            >
              <span>Poore &amp; Nemecek · Science 2018</span>
              <ExternalLink size={11} aria-hidden="true" />
            </a>
          </div>
        </div>

        <div className="vegan-module-grid">
          {/* Left Controls: Ordered 4-Diet Spectrum from Highest to Lowest */}
          <div className="vegan-controls-panel">
            <div>
              <span className="control-group-label">
                Wybierz dietę (porównanie vs średnia EU)
              </span>
              {DIET_PROFILES.map((diet) => {
                const pctDiff = Math.round(
                  ((diet.daily.co2 - base.daily.co2) / base.daily.co2) * 100,
                );
                const badgeTone = diet.isBaseline
                  ? 'is-base'
                  : pctDiff < 0
                  ? 'is-saving'
                  : 'is-worse';
                const badgeText = diet.isBaseline
                  ? 'BAZA (0)'
                  : `${pctDiff > 0 ? '+' : '−'}${Math.abs(pctDiff)}% CO₂e`;
                const isSelected = diet.id === selectedDietId;

                return (
                  <button
                    key={diet.id}
                    type="button"
                    className={`baseline-option ${isSelected ? `active ${badgeTone}` : ''}`}
                    aria-pressed={isSelected}
                    onClick={() => onChangeDiet(diet.id)}
                  >
                    <div className="diet-option-top">
                      <span className="baseline-option-title">{diet.label}</span>
                      <span className={`diet-delta-tag mono ${badgeTone}`}>
                        {badgeText}
                      </span>
                    </div>
                    <span className="baseline-option-sub">
                      {diet.subtitle} · {formatNumberPL(diet.daily.co2)} kg CO₂e/d
                    </span>
                  </button>
                );
              })}
            </div>

            <div>
              <span className="control-group-label">Horyzont kumulacji</span>
              <div className="slider-readout">
                <span>Okres:</span>
                <strong className={`tabular ${toneClass}`}>
                  {formatDurationLabel(days)}
                </strong>
              </div>
              <input
                type="range"
                min={7}
                max={3650}
                step={1}
                value={days}
                onChange={(e) => onChangeDays(Number(e.target.value))}
                className={`range-slider ${toneClass}`}
                aria-label="Horyzont kumulacji w dniach (od 7 dni do 10 lat)"
              />
              <div
                className="horizon-pills horizon-pills-wrap"
                style={{ marginTop: 8, width: '100%' }}
              >
                {HORIZON_PRESETS.map((p) => (
                  <button
                    key={p.days}
                    type="button"
                    className={`horizon-pill ${days === p.days ? 'active' : ''}`}
                    aria-pressed={days === p.days}
                    onClick={() => onChangeDays(p.days)}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <p
              style={{
                margin: 0,
                fontSize: '0.8rem',
                color: '#a9aba6',
                lineHeight: 1.45,
              }}
            >
              Dane dzienne (2 000 kcal/dzień) pochodzą z badania 55 504 osób połączonego z bazą
              LCA 38 700 gospodarstw (Scarborough et al. 2023, <em>Nature Food</em>).
            </p>
          </div>

          {/* Right Readouts (Signed Delta vs EU Avg, or Total for EU Baseline) + Total-Footprint Delta Chart */}
          <div style={{ minWidth: 0 }}>
            <div className={`diet-status-banner ${toneClass}`}>
              <span className="mono">
                {isBaseline
                  ? 'PUNKT ODNIESIENIA (0) · CAŁKOWITY ŚLAD ŚREDNIEJ DIETY EUROPEJSKIEJ'
                  : isSaving
                  ? `OSZCZĘDNOŚĆ WZGLĘDEM ŚREDNIEJ DIETY EUROPEJSKIEJ (${selectedDiet.label.toUpperCase()})`
                  : `DODATKOWE OBCIĄŻENIE PONAD ŚREDNIĄ DIETĘ EUROPEJSKĄ (${selectedDiet.label.toUpperCase()})`}
              </span>
              <span className="mono diet-status-total">
                Łączny ślad wybranej diety: {formatNumberPL(totalCo2)} kg CO₂e
              </span>
            </div>

            <div className={`vegan-metrics-grid ${toneClass}`}>
              <div className="vegan-metric-cell">
                <div className="vegan-metric-head">
                  {isBaseline
                    ? 'Całkowity ślad węglowy'
                    : isSaving
                    ? 'Uniknięty ślad węglowy'
                    : 'Dodatkowy ślad węglowy'}
                </div>
                <div className={`vegan-metric-big tabular ${toneClass}`}>
                  {signPrefix}
                  {formatNumberPL(animCo2)}
                  <span>kg CO₂e</span>
                </div>
                <div className="vegan-metric-equiv">
                  Równowartość{' '}
                  <strong>
                    {eqFlights.toLocaleString('pl-PL')}{' '}
                    {polishNoun(eqFlights, 'lotu', 'lotów', 'lotów', 'lotu')} Warszawa–Londyn
                  </strong>{' '}
                  lub {eqChinaParcels.toLocaleString('pl-PL')} paczek lotniczych z Chin.
                </div>
              </div>

              <div className="vegan-metric-cell">
                <div className="vegan-metric-head">
                  {isBaseline
                    ? 'Całkowite zużycie wody słodkiej'
                    : isSaving
                    ? 'Zaoszczędzona woda słodka'
                    : 'Dodatkowe zużycie wody'}
                </div>
                <div className={`vegan-metric-big tabular ${toneClass}`}>
                  {signPrefix}
                  {formatNumberPL(animWater)}
                  <span>L wody</span>
                </div>
                <div className="vegan-metric-equiv">
                  Odpowiada ok.{' '}
                  <strong>{eqShowers.toLocaleString('pl-PL')} prysznicom</strong> (po 60 L) ·
                  bezpośredni pobór wody wg Scarborough et al. (2023).
                </div>
              </div>

              <div className="vegan-metric-cell">
                <div className="vegan-metric-head">
                  {isBaseline
                    ? 'Całkowita zajętość gleby'
                    : isSaving
                    ? 'Gleba ocalona przed degradacją'
                    : 'Dodatkowa presja na glebę'}
                </div>
                <div className={`vegan-metric-big tabular ${toneClass}`}>
                  {signPrefix}
                  {formatNumberPL(animLand)}
                  <span>m²·rok</span>
                </div>
                <div className="vegan-metric-equiv">
                  To{' '}
                  <strong>
                    {eqFootballPitches.toLocaleString('pl-PL', {
                      minimumFractionDigits: eqFootballPitches < 1 ? 2 : 1,
                      maximumFractionDigits: 2,
                    })}{' '}
                    {polishNoun(eqFootballPitches, 'boiska', 'boisk', 'boisk', 'boiska')}{' '}
                    piłkarskiego
                  </strong>{' '}
                  {isSaving
                    ? 'ziemi odciążonej od wypasu i pasz.'
                    : isWorse
                    ? 'dodatkowego terenu pod hodowlę i pasze.'
                    : 'ziemi pod produkcję żywności.'}
                </div>
              </div>

              <div className="vegan-metric-cell">
                <div className="vegan-metric-head">
                  {isBaseline
                    ? 'Eutrofizacja wód (spływ azotu/fosforu)'
                    : isSaving
                    ? 'Mniej zanieczyszczeń wód'
                    : 'Więcej zanieczyszczeń wód'}
                </div>
                <div className={`vegan-metric-big tabular ${toneClass}`}>
                  {signPrefix}
                  {formatNumberPL(animEutro)}
                  <span>kg PO₄e</span>
                </div>
                <div className="vegan-metric-equiv">
                  Spływ nawozów i gnojowicy do rzek oraz Bałtyku — główna przyczyna zakwitów
                  sinic i martwych stref.
                </div>
              </div>
            </div>

            {/* Interactive 4-Diet Total Footprint & Delta-Wedge SVG Chart */}
            <div className="vegan-curve-panel">
              <div className="vegan-curve-header">
                <span className="vegan-curve-title">
                  Łączny ślad CO₂e wszystkich 4 diet (kliknij lub przeciągnij na wykresie)
                </span>
                <span className="mono" style={{ fontSize: '0.74rem', color: activeColor }}>
                  {isBaseline
                    ? `Baza EU: ${formatNumberPL(base.daily.co2)} kg CO₂e / dzień`
                    : `${signPrefix}${formatNumberPL(Math.abs(selectedDiet.daily.co2 - base.daily.co2))} kg CO₂e / dzień vs EU`}
                </span>
              </div>

              <svg
                ref={svgRef}
                viewBox={`0 0 ${svgW} ${svgH}`}
                className={`vegan-scrub-svg ${isScrubbing ? 'is-scrubbing' : ''}`}
                role="img"
                aria-label={`Wykres łącznego śladu CO₂e 4 diet w czasie. Wybrana ${
                  selectedDiet.label
                }: ${formatNumberPL(totalCo2)} kg po ${days} dniach.`}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  setIsScrubbing(true);
                  updateDaysFromClientX(e.clientX);
                }}
                onPointerMove={(e) => {
                  if (!isScrubbing) return;
                  updateDaysFromClientX(e.clientX);
                }}
                onPointerUp={() => setIsScrubbing(false)}
                onPointerCancel={() => setIsScrubbing(false)}
              >
                {/* Horizontal gridlines */}
                {[0.25, 0.5, 0.75, 1].map((frac) => {
                  const y = padT + plotH * (1 - frac);
                  const val = maxCo2 * frac;
                  return (
                    <g key={frac}>
                      <line
                        x1={padL}
                        y1={y}
                        x2={svgW - padR}
                        y2={y}
                        stroke="rgba(236, 234, 227, 0.13)"
                        strokeDasharray="3 4"
                      />
                      <text
                        x={padL - 8}
                        y={y + 4}
                        textAnchor="end"
                        fontFamily="JetBrains Mono, monospace"
                        fontSize="10"
                        fill="#A9ABA6"
                      >
                        {Math.round(val / 1000)} t
                      </text>
                    </g>
                  );
                })}

                {/* Shaded delta wedge between EU average baseline and selected diet */}
                {!isBaseline && <path d={wedgePath} fill={wedgeFill} />}

                {/* All 4 real diet trajectories */}
                {DIET_PROFILES.map((d) => {
                  const isSelected = d.id === selectedDietId;
                  const endY = yOf(d.daily.co2 * maxDays);
                  const strokeColor = d.isBaseline
                    ? 'rgba(236, 234, 227, 0.7)'
                    : isSelected
                    ? activeColor
                    : 'rgba(236, 234, 227, 0.25)';

                  return (
                    <g key={d.id}>
                      <line
                        x1={padL}
                        y1={padT + plotH}
                        x2={svgW - padR}
                        y2={endY}
                        stroke={strokeColor}
                        strokeWidth={isSelected ? '2.2' : d.isBaseline ? '1.5' : '1.1'}
                        strokeDasharray={d.isBaseline ? '5 4' : isSelected ? undefined : '3 4'}
                      />
                      <text
                        x={svgW - padR + 8}
                        y={endY + 4}
                        fontFamily="JetBrains Mono, monospace"
                        fontSize="9.5"
                        fontWeight={isSelected || d.isBaseline ? '700' : '500'}
                        fill={
                          isSelected
                            ? activeColor
                            : d.isBaseline
                            ? '#ECEAE3'
                            : '#9E9F99'
                        }
                      >
                        {d.shortLabel}
                      </text>
                    </g>
                  );
                })}

                {/* Active bold segment up to selected horizon */}
                <line
                  x1={padL}
                  y1={padT + plotH}
                  x2={activeX}
                  y2={activeY}
                  stroke={activeColor}
                  strokeWidth="3.2"
                  strokeLinecap="round"
                />

                {/* Vertical comparison bracket between baseline and selected diet at activeX */}
                <line
                  x1={activeX}
                  y1={Math.min(activeY, baseYAtDays)}
                  x2={activeX}
                  y2={padT + plotH}
                  stroke={activeColor}
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
                {!isBaseline && (
                  <circle
                    cx={activeX}
                    cy={baseYAtDays}
                    r="4"
                    fill="#141615"
                    stroke="#ECEAE3"
                    strokeWidth="2"
                  />
                )}
                <circle
                  cx={activeX}
                  cy={activeY}
                  r="7"
                  fill="#141615"
                  stroke={activeColor}
                  strokeWidth="3"
                />

                {/* Bottom X-axis */}
                <line
                  x1={padL}
                  y1={padT + plotH}
                  x2={svgW - padR}
                  y2={padT + plotH}
                  stroke="#ECEAE3"
                  strokeWidth="1.5"
                />
                {milestones.map((m) => {
                  const mx = xOf(m.d);
                  return (
                    <g key={m.d}>
                      <line
                        x1={mx}
                        y1={padT + plotH}
                        x2={mx}
                        y2={padT + plotH + 7}
                        stroke="#ECEAE3"
                        strokeWidth="1.25"
                      />
                      <text
                        x={mx}
                        y={padT + plotH + 22}
                        textAnchor="middle"
                        fontFamily="JetBrains Mono, monospace"
                        fontSize="10.5"
                        fill="#C6C5BE"
                      >
                        {m.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
