import React from 'react';
import { ExternalLink } from 'lucide-react';
import { SOURCES } from '../data/evidence';

export const SourcesLedgerSection: React.FC = () => {
  const sourceList = Object.values(SOURCES);

  return (
    <section id="baza-badan" className="section-block" aria-labelledby="sources-heading">
      <div className="section-header">
        <div>
          <h2 id="sources-heading" className="section-heading">
            Baza badań naukowych i raportów LCA ({sourceList.length})
          </h2>
          <p className="section-lead">
            Każda liczba w instrumencie SKALA opiera się na publicznych, recenzowanych
            publikacjach naukowych lub oficjalnych rządowych współczynnikach konwersji
            (Life Cycle Assessment). Poniżej znajdują się bezpośrednie linki do wszystkich
            źródeł bazowych.
          </p>
        </div>
      </div>

      <div className="sources-grid">
        {sourceList.map((src) => (
          <article key={src.id} id={`source-${src.id}`} className="source-card">
            <div>
              <div className="source-card-top">
                <span className="source-tag mono">{src.shortBadge}</span>
                <span className="source-year">{src.year}</span>
              </div>
              <p className="source-citation" style={{ marginTop: 10 }}>
                {src.citation}
              </p>
              <p className="source-scope" style={{ marginTop: 6 }}>
                {src.scope}
              </p>
            </div>

            <a
              href={src.url}
              target="_blank"
              rel="noopener noreferrer"
              className="source-ext-link"
              aria-label={`Otwórz publikację ${src.shortBadge} (${src.institution}) w nowej karcie`}
            >
              <span>Otwórz publikację ({src.institution})</span>
              <ExternalLink size={12} strokeWidth={2} aria-hidden="true" />
            </a>
          </article>
        ))}
      </div>
    </section>
  );
};
