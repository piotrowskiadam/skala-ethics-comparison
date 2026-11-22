import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { SOURCES } from '../data/evidence';

export const SourcesLedgerSection: React.FC = () => {
  const sourceList = Object.values(SOURCES);

  return (
    <section id="baza-badan" className="section-block" aria-labelledby="sources-heading">
      <div className="section-header">
        <div>
          <h2 id="sources-heading" className="section-heading">
            Źródła naukowe i raporty LCA
          </h2>
          <p className="section-lead">
            Wszystkie estymacje pochodzą z publicznych, recenzowanych publikacji i oficjalnych
            współczynników konwersji. Kliknij dowolną pozycję, aby otworzyć materiał źródłowy.
          </p>
        </div>
      </div>

      {/* Unboxed 2-column Swiss academic index (replaces 12-card grid) */}
      <ol className="sources-index">
        {sourceList.map((src, idx) => (
          <li key={src.id} id={`source-${src.id}`} className="source-row">
            <span className="source-num tabular">
              {String(idx + 1).padStart(2, '0')}
            </span>
            <div className="source-row-body">
              <div className="source-row-head">
                <a
                  href={src.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="source-row-link"
                  aria-label={`Otwórz źródło ${src.shortBadge} w nowej karcie`}
                >
                  <span>{src.shortBadge}</span>
                  <ArrowUpRight size={14} strokeWidth={2} aria-hidden="true" />
                </a>
                <span className="source-row-inst">
                  {src.institution} · {src.year}
                </span>
              </div>
              <p className="source-row-scope">{src.scope}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};
