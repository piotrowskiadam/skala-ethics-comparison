import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import {
  CATEGORY_LABELS,
  DECISIONS,
  DecisionCategory,
  METRICS,
  MetricKey,
  SOURCES,
  formatMetricValue,
} from '../data/evidence';

interface SpecimenPickerModalProps {
  side: 'left' | 'right';
  currentId: string;
  otherId: string;
  activeMetric: MetricKey;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const CATEGORIES = Object.keys(CATEGORY_LABELS) as DecisionCategory[];

export const SpecimenPickerModal: React.FC<SpecimenPickerModalProps> = ({
  side,
  currentId,
  otherId,
  activeMetric,
  onSelect,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<DecisionCategory | 'all'>('all');
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return DECISIONS.filter((d) => {
      if (category !== 'all' && d.category !== category) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.shortLabel.toLowerCase().includes(q) ||
        d.unit.toLowerCase().includes(q) ||
        CATEGORY_LABELS[d.category].toLowerCase().includes(q)
      );
    }).sort((a, b) => a.metrics[activeMetric] - b.metrics[activeMetric]);
  }, [query, category, activeMetric]);

  return (
    <div
      className="picker-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="picker-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="picker-sheet">
        <div className="picker-header">
          <div>
            <span className="mono picker-kicker">
              KATALOG ODWAŻNIKÓW · {side === 'left' ? 'SZALKA LEWA' : 'SZALKA PRAWA'}
            </span>
            <h2 id="picker-title" className="picker-title">
              Wybierz decyzję do zważenia ({METRICS[activeMetric].shortLabel})
            </h2>
          </div>
          <button
            type="button"
            className="picker-close-btn"
            onClick={onClose}
            aria-label="Zamknij katalog odważników"
          >
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="picker-search-wrap">
          <Search size={16} className="picker-search-icon" aria-hidden="true" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Szukaj (np. AI, Chiny, wołowina, pociąg, smartfon)..."
            className="picker-search-input"
            aria-label="Wyszukaj decyzję"
          />
        </div>

        <div className="picker-cats" role="group" aria-label="Filtr kategorii w katalogu">
          <button
            type="button"
            className={`filter-chip ${category === 'all' ? 'active' : ''}`}
            aria-pressed={category === 'all'}
            onClick={() => setCategory('all')}
          >
            Wszystkie ({DECISIONS.length})
          </button>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`filter-chip ${category === cat ? 'active' : ''}`}
              aria-pressed={category === cat}
              onClick={() => setCategory(cat)}
            >
              {CATEGORY_LABELS[cat]}
            </button>
          ))}
        </div>

        <div className="picker-list" role="listbox" aria-label="Lista decyzji">
          {filtered.length === 0 ? (
            <div className="picker-empty mono">
              Brak pozycji pasujących do „{query}”.
            </div>
          ) : (
            filtered.map((item) => {
              const isCurrent = item.id === currentId;
              const isOther = item.id === otherId;
              const src = SOURCES[item.primarySourceId];
              return (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={isCurrent}
                  className={`picker-row ${isCurrent ? 'is-current' : ''}`}
                  onClick={() => {
                    onSelect(item.id);
                    onClose();
                  }}
                >
                  <div className="picker-row-main">
                    <span className="picker-row-name">
                      {item.name}
                      {isCurrent && (
                        <span className="picker-state-tag mono">AKTYWNA</span>
                      )}
                      {isOther && !isCurrent && (
                        <span className="picker-state-tag is-muted mono">
                          DRUGA SZALKA
                        </span>
                      )}
                    </span>
                    <span className="picker-row-meta mono">
                      {CATEGORY_LABELS[item.category]} · {item.unit} · {src.shortBadge}
                    </span>
                  </div>
                  <div className="picker-row-value tabular">
                    {formatMetricValue(item.metrics[activeMetric], activeMetric)}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
