import React, { useRef, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import {
  DietBaseline,
  SOURCES,
  VEGAN_BASELINES,
  formatNumberPL,
} from '../data/evidence';
import { useAnimatedNumber } from '../hooks/useAnimatedNumber';

interface VeganCumulativeSectionProps {
  baselineId: DietBaseline['id'];
  days: number;
  onChangeBaseline: (id: DietBaseline['id']) => void;
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
  baselineId,
  days,
  onChangeBaseline,
  onChangeDays,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);

  const baseline =
    VEGAN_BASELINES.find((b) => b.id === baselineId) ?? VEGAN_BASELINES[0];

  const savedCo2 = baseline.dailySaved.co2 * days;
  const savedWater = baseline.dailySaved.water * days;
  const savedLand = baseline.dailySaved.land * days;
  const savedEnergy = baseline.dailySaved.energy * days;

  const animCo2 = useAnimatedNumber(savedCo2, 320);
  const animWater = useAnimatedNumber(savedWater, 320);
  const animLand = useAnimatedNumber(savedLand, 320);
  const animEnergy = useAnimatedNumber(savedEnergy, 320);

  const eqFlights = Math.round((savedCo2 / 395) * 10) / 10;
  const eqChinaParcels = Math.round(savedCo2 / 12.4);
  const eqShowers = Math.round(savedWater / 60);
  const eqFootballPitches = Math.round((savedLand / 7140) * 100) / 100;
  const eqHouseMonths = Math.round((savedEnergy / 180) * 10) / 10;

  const maxDays = 3650;
  const maxBaselineCo2 =
    Math.max(...VEGAN_BASELINES.map((b) => b.dailySaved.co2)) * maxDays;

  const svgW = 720;
  const svgH = 228;
  const padL = 52;
  const padR = 112;
  const padT = 20;
  const padB = 34;
  const plotW = svgW - padL - padR;
  const plotH = svgH - padT - padB;

  const xOf = (d: number) => padL + (d / maxDays) * plotW;
  const yOf = (val: number) => padT + plotH - (val / maxBaselineCo2) * plotH;

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
  const activeY = yOf(savedCo2);

  const areaPath = `M ${padL} ${padT + plotH} L ${activeX} ${activeY} L ${activeX} ${
    padT + plotH
  } Z`;

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
              Kumulacja pozytywnego wpływu diety wegańskiej
            </h2>
            <p className="section-lead">
              Pojedynczy obiad wegański oszczędza kilka kilogramów CO₂e — ale powtarzany
              codziennie kumuluje się w tony unikniętych emisji, setki tysięcy litrów wody i
              tysiące metrów kwadratowych gleby ocalonej przed degradacją i wylesianiem.
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
          {/* Left Controls */}
          <div className="vegan-controls-panel">
            <div>
              <span className="control-group-label">
                Punkt odniesienia (dieta wyjściowa)
              </span>
              {VEGAN_BASELINES.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={`baseline-option ${item.id === baselineId ? 'active' : ''}`}
                  aria-pressed={item.id === baselineId}
                  onClick={() => onChangeBaseline(item.id)}
                >
                  <span className="baseline-option-title">{item.label}</span>
                  <span className="baseline-option-sub">{item.subtitle}</span>
                </button>
              ))}
            </div>

            <div>
              <span className="control-group-label">Horyzont kumulacji</span>
              <div className="slider-readout">
                <span>Okres:</span>
                <strong className="tabular">{formatDurationLabel(days)}</strong>
              </div>
              <input
                type="range"
                min={7}
                max={3650}
                step={1}
                value={days}
                onChange={(e) => onChangeDays(Number(e.target.value))}
                className="range-slider"
                aria-label="Horyzont kumulacji w dniach (od 7 dni do 10 lat)"
              />
              <div className="horizon-pills horizon-pills-wrap" style={{ marginTop: 8, width: '100%' }}>
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
              Dane dzienne pochodzą z analizy 55 504 diet w Wielkiej Brytanii połączonej z
              globalną bazą LCA 38 700 gospodarstw (Scarborough et al. 2023,{' '}
              <em>Nature Food</em>).
            </p>
          </div>

          {/* Right Readouts + Interactive Scrubbable 3-Baseline Cumulative Chart */}
          <div style={{ minWidth: 0 }}>
            <div className="vegan-metrics-grid">
              <div className="vegan-metric-cell">
                <div className="vegan-metric-head">Uniknięty ślad węglowy</div>
                <div className="vegan-metric-big tabular">
                  −{formatNumberPL(animCo2)}
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
                <div className="vegan-metric-head">Zaoszczędzona woda słodka</div>
                <div className="vegan-metric-big tabular">
                  −{formatNumberPL(animWater)}
                  <span>L wody</span>
                </div>
                <div className="vegan-metric-equiv">
                  Odpowiada ok.{' '}
                  <strong>{eqShowers.toLocaleString('pl-PL')} prysznicom</strong> (po 60 L
                  każdy) lub produkcji {Math.round(savedWater / 2700).toLocaleString('pl-PL')}{' '}
                  bawełnianych T-shirtów.
                </div>
              </div>

              <div className="vegan-metric-cell">
                <div className="vegan-metric-head">Gleba ocalona przed degradacją</div>
                <div className="vegan-metric-big tabular">
                  −{formatNumberPL(animLand)}
                  <span>m²·rok</span>
                </div>
                <div className="vegan-metric-equiv">
                  To{' '}
                  <strong>
                    {eqFootballPitches.toLocaleString('pl-PL', {
                      minimumFractionDigits: eqFootballPitches < 1 ? 2 : 1,
                      maximumFractionDigits: 2,
                    })}{' '}
                    {polishNoun(
                      eqFootballPitches,
                      'boiska',
                      'boisk',
                      'boisk',
                      'boiska',
                    )}{' '}
                    piłkarskiego
                  </strong>{' '}
                  ziemi odciążonej od wypasu i upraw paszowych.
                </div>
              </div>

              <div className="vegan-metric-cell">
                <div className="vegan-metric-head">Zaoszczędzona energia</div>
                <div className="vegan-metric-big tabular">
                  −{formatNumberPL(animEnergy)}
                  <span>kWh</span>
                </div>
                <div className="vegan-metric-equiv">
                  Tyle prądu zużywa przeciętne mieszkanie przez{' '}
                  <strong>{eqHouseMonths.toLocaleString('pl-PL')} mies.</strong> (przy 180
                  kWh/mies.).
                </div>
              </div>
            </div>

            {/* Interactive 3-Baseline Cumulative Trajectory SVG Chart */}
            <div className="vegan-curve-panel">
              <div className="vegan-curve-header">
                <span className="vegan-curve-title">
                  Porównanie 3 ścieżek kumulacji CO₂e (kliknij lub przeciągnij na wykresie)
                </span>
                <span className="mono" style={{ fontSize: '0.74rem', color: '#E07A4F' }}>
                  Aktywna: +{formatNumberPL(baseline.dailySaved.co2)} kg CO₂e / dzień
                </span>
              </div>

              <svg
                ref={svgRef}
                viewBox={`0 0 ${svgW} ${svgH}`}
                className={`vegan-scrub-svg ${isScrubbing ? 'is-scrubbing' : ''}`}
                role="img"
                aria-label={`Wykres kumulacji oszczędności CO₂e dla 3 diet bazowych. Wybrana ${
                  baseline.label
                }: ${formatNumberPL(savedCo2)} kg po ${days} dniach.`}
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
                {[0.25, 0.5, 0.75, 1].map((frac) => {
                  const y = padT + plotH * (1 - frac);
                  const val = maxBaselineCo2 * frac;
                  return (
                    <g key={frac}>
                      <line
                        x1={padL}
                        y1={y}
                        x2={svgW - padR}
                        y2={y}
                        stroke="rgba(236, 234, 227, 0.14)"
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

                {VEGAN_BASELINES.map((b) => {
                  const isSelected = b.id === baselineId;
                  const endY = yOf(b.dailySaved.co2 * maxDays);
                  const shortName =
                    b.id === 'high-meat'
                      ? 'Wysokomięsna'
                      : b.id === 'medium-meat'
                      ? 'Średnia mięsna'
                      : 'Niskomięsna';
                  return (
                    <g key={b.id}>
                      <line
                        x1={padL}
                        y1={padT + plotH}
                        x2={svgW - padR}
                        y2={endY}
                        stroke={
                          isSelected
                            ? 'rgba(224, 122, 79, 0.65)'
                            : 'rgba(236, 234, 227, 0.28)'
                        }
                        strokeWidth={isSelected ? '1.8' : '1.15'}
                        strokeDasharray="4 4"
                      />
                      <text
                        x={svgW - padR + 8}
                        y={endY + 4}
                        fontFamily="JetBrains Mono, monospace"
                        fontSize="9.5"
                        fontWeight={isSelected ? '700' : '500'}
                        fill={isSelected ? '#E07A4F' : '#A9ABA6'}
                      >
                        {shortName}
                      </text>
                    </g>
                  );
                })}

                <path d={areaPath} fill="rgba(224, 122, 79, 0.22)" />
                <line
                  x1={padL}
                  y1={padT + plotH}
                  x2={activeX}
                  y2={activeY}
                  stroke="#E07A4F"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                <line
                  x1={activeX}
                  y1={activeY}
                  x2={activeX}
                  y2={padT + plotH}
                  stroke="#E07A4F"
                  strokeWidth="1.2"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={activeX}
                  cy={activeY}
                  r="7"
                  fill="#141615"
                  stroke="#E07A4F"
                  strokeWidth="3"
                />

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
