import React from 'react';
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

function formatDurationLabel(days: number): string {
  if (days < 30) return `${days} dni`;
  if (days < 365) {
    const months = Math.round((days / 30.4) * 10) / 10;
    return `${days} dni (ok. ${months.toLocaleString('pl-PL')} mies.)`;
  }
  const years = Math.round((days / 365) * 10) / 10;
  return `${years.toLocaleString('pl-PL')} ${
    years === 1 ? 'rok' : years < 5 ? 'lata' : 'lat'
  } (${days.toLocaleString('pl-PL')} dni)`;
}

export const VeganCumulativeSection: React.FC<VeganCumulativeSectionProps> = ({
  baselineId,
  days,
  onChangeBaseline,
  onChangeDays,
}) => {
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

  const eqFlights = savedCo2 / 395;
  const eqChinaParcels = savedCo2 / 12.4;
  const eqShowers = savedWater / 60;
  const eqFootballPitches = savedLand / 7140;
  const eqHouseMonths = savedEnergy / 180;

  // Multi-baseline chart scaled to the highest diet (high-meat over 10 years) so comparing baselines visually moves the slope!
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
    <section
      id="kumulacja-weganska"
      className="section-block"
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
            <span className="control-group-label">Punkt odniesienia (dieta wyjściowa)</span>
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
            <div className="horizon-pills" style={{ marginTop: 8, width: '100%' }}>
              {HORIZON_PRESETS.map((p) => (
                <button
                  key={p.days}
                  type="button"
                  style={{ flex: 1 }}
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
              color: 'var(--ink-muted)',
              lineHeight: 1.45,
            }}
          >
            Dane dzienne pochodzą z analizy 55 504 diet w Wielkiej Brytanii połączonej z
            globalną bazą LCA 38 700 gospodarstw (Scarborough et al. 2023,{' '}
            <em>Nature Food</em>).
          </p>
        </div>

        {/* Right Readouts + 3-Baseline Cumulative Chart */}
        <div>
          <div className="vegan-metrics-grid" aria-live="polite">
            <div className="vegan-metric-cell">
              <div className="vegan-metric-head">Uniknięty ślad węglowy</div>
              <div className="vegan-metric-big tabular">
                −{formatNumberPL(animCo2)}
                <span>kg CO₂e</span>
              </div>
              <div className="vegan-metric-equiv">
                Równowartość{' '}
                <strong>
                  {eqFlights < 1
                    ? eqFlights.toLocaleString('pl-PL', { maximumFractionDigits: 2 })
                    : formatNumberPL(eqFlights, 1)}{' '}
                  lotów Warszawa–Londyn
                </strong>{' '}
                lub {formatNumberPL(eqChinaParcels, 0)} paczek lotniczych z Chin.
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
                <strong>{formatNumberPL(eqShowers, 0)} prysznicom</strong> (po 60 L każdy)
                lub produkcji {formatNumberPL(savedWater / 2700, 0)} bawełnianych T-shirtów.
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
                  {eqFootballPitches < 0.1
                    ? eqFootballPitches.toLocaleString('pl-PL', {
                        minimumFractionDigits: 3,
                        maximumFractionDigits: 3,
                      })
                    : eqFootballPitches.toLocaleString('pl-PL', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                  boiska piłkarskiego
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
                <strong>{formatNumberPL(eqHouseMonths, 1)} mies.</strong> (przy 180 kWh/mies.).
              </div>
            </div>
          </div>

          {/* 3-Baseline Cumulative Trajectory SVG Chart */}
          <div className="vegan-curve-panel">
            <div className="vegan-curve-header">
              <span className="vegan-curve-title">
                Porównanie 3 ścieżek kumulacji CO₂e (7 dni → 10 lat)
              </span>
              <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--copper)' }}>
                Aktywna: +{formatNumberPL(baseline.dailySaved.co2)} kg CO₂e / dzień
              </span>
            </div>

            <svg
              viewBox={`0 0 ${svgW} ${svgH}`}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              role="img"
              aria-label={`Wykres kumulacji oszczędności CO₂e dla 3 diet bazowych. Wybrana ${
                baseline.label
              }: ${formatNumberPL(savedCo2)} kg po ${days} dniach.`}
            >
              {/* Horizontal reference gridlines */}
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
                      stroke="rgba(20, 22, 21, 0.12)"
                      strokeDasharray="3 4"
                    />
                    <text
                      x={padL - 8}
                      y={y + 4}
                      textAnchor="end"
                      fontFamily="JetBrains Mono, monospace"
                      fontSize="10"
                      fill="#5A605C"
                    >
                      {Math.round(val / 1000)} t
                    </text>
                  </g>
                );
              })}

              {/* All 3 diet trajectories plotted simultaneously */}
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
                      stroke={isSelected ? 'rgba(164, 75, 39, 0.45)' : 'rgba(20, 22, 21, 0.24)'}
                      strokeWidth={isSelected ? '1.6' : '1.15'}
                      strokeDasharray="4 4"
                    />
                    <text
                      x={svgW - padR + 8}
                      y={endY + 4}
                      fontFamily="JetBrains Mono, monospace"
                      fontSize="9.5"
                      fontWeight={isSelected ? '700' : '500'}
                      fill={isSelected ? '#A44B27' : '#5A605C'}
                    >
                      {shortName}
                    </text>
                  </g>
                );
              })}

              {/* Active accumulated copper wedge */}
              <path d={areaPath} fill="rgba(164, 75, 39, 0.16)" />
              <line
                x1={padL}
                y1={padT + plotH}
                x2={activeX}
                y2={activeY}
                stroke="#A44B27"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Active vertical hairline & marker dot */}
              <line
                x1={activeX}
                y1={activeY}
                x2={activeX}
                y2={padT + plotH}
                stroke="#A44B27"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
              <circle
                cx={activeX}
                cy={activeY}
                r="6"
                fill="#F4F2EC"
                stroke="#A44B27"
                strokeWidth="2.8"
              />

              {/* Bottom X-axis baseline & milestone ticks */}
              <line
                x1={padL}
                y1={padT + plotH}
                x2={svgW - padR}
                y2={padT + plotH}
                stroke="#141615"
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
                      stroke="#141615"
                      strokeWidth="1.25"
                    />
                    <text
                      x={mx}
                      y={padT + plotH + 22}
                      textAnchor="middle"
                      fontFamily="JetBrains Mono, monospace"
                      fontSize="10.5"
                      fill="#3F4441"
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
  );
};
