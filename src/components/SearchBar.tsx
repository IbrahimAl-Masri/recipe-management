'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import type { Difficulty, Recipe } from './RecipeCard';
import type { RecipeStatus } from './StatusBadge';

export interface SearchFilters {
  cuisineType?: string;
  difficulty?: Difficulty;
  status?: RecipeStatus;
}

type FilterKey = keyof SearchFilters;
type DropdownKey = FilterKey | null;

interface SearchBarProps {
  onSearch: (query: string, filters: SearchFilters) => void;
  debounceMs?: number;
  cuisineTypes?: string[];
}

const DEFAULT_CUISINE_TYPES: Recipe['cuisineType'][] = [
  'Italian',
  'Mexican',
  'Asian',
  'American',
  'Mediterranean',
  'Indian',
  'French',
  'Japanese',
  'Thai',
  'Greek',
  'Spanish',
  'Other',
];

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
];

const STATUSES: { value: RecipeStatus; label: string }[] = [
  { value: 'favorite', label: 'Favorite' },
  { value: 'to_try', label: 'To Try' },
  { value: 'made_before', label: 'Made Before' },
];

export function SearchBar({
  onSearch,
  debounceMs = 300,
  cuisineTypes = DEFAULT_CUISINE_TYPES,
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});
  const [openDropdown, setOpenDropdown] = useState<DropdownKey>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep a stable ref to onSearch so the debounce effect doesn't re-run on every render
  const onSearchRef = useRef(onSearch);
  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchRef.current(query, filters);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [query, filters, debounceMs]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function setFilter<K extends FilterKey>(key: K, value: SearchFilters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setOpenDropdown(null);
  }

  function clearFilter(key: FilterKey) {
    setFilters((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function clearAll() {
    setQuery('');
    setFilters({});
  }

  function activeLabel(key: FilterKey): string {
    const v = filters[key];
    if (!v) return '';
    if (key === 'difficulty') return DIFFICULTIES.find((d) => d.value === v)?.label ?? v;
    if (key === 'status') return STATUSES.find((s) => s.value === v)?.label ?? v;
    return v as string;
  }

  const activeFilterCount = Object.keys(filters).length;
  const hasAnyActive = activeFilterCount > 0 || query.length > 0;

  return (
    <div ref={containerRef} className="w-full space-y-2">
      {/* Search input */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipes…"
            className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-9 pr-9 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-zinc-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filters button */}
        <button
          type="button"
          onClick={() =>
            setOpenDropdown((prev) => (prev === null ? 'cuisineType' : null))
          }
          className={`relative flex h-10 items-center gap-1.5 rounded-xl border px-3 text-sm transition-colors ${
            activeFilterCount > 0
              ? 'border-zinc-900 bg-zinc-900 text-white'
              : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
          }`}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {activeFilterCount > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-xs font-bold text-zinc-900">
              {activeFilterCount}
            </span>
          )}
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        <FilterChip
          label="Cuisine"
          activeLabel={activeLabel('cuisineType')}
          isOpen={openDropdown === 'cuisineType'}
          onToggle={() =>
            setOpenDropdown((prev) => (prev === 'cuisineType' ? null : 'cuisineType'))
          }
          onClear={() => clearFilter('cuisineType')}
        >
          <ul className="max-h-52 overflow-y-auto py-1">
            {cuisineTypes.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  onClick={() => setFilter('cuisineType', c)}
                  className={`flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-zinc-50 ${
                    filters.cuisineType === c ? 'font-semibold text-zinc-900' : 'text-zinc-600'
                  }`}
                >
                  {c}
                  {filters.cuisineType === c && (
                    <span className="ml-auto text-zinc-400">✓</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </FilterChip>

        <FilterChip
          label="Difficulty"
          activeLabel={activeLabel('difficulty')}
          isOpen={openDropdown === 'difficulty'}
          onToggle={() =>
            setOpenDropdown((prev) => (prev === 'difficulty' ? null : 'difficulty'))
          }
          onClear={() => clearFilter('difficulty')}
        >
          <ul className="py-1">
            {DIFFICULTIES.map((d) => (
              <li key={d.value}>
                <button
                  type="button"
                  onClick={() => setFilter('difficulty', d.value)}
                  className={`flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-zinc-50 ${
                    filters.difficulty === d.value ? 'font-semibold text-zinc-900' : 'text-zinc-600'
                  }`}
                >
                  {d.label}
                  {filters.difficulty === d.value && (
                    <span className="ml-auto text-zinc-400">✓</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </FilterChip>

        <FilterChip
          label="Status"
          activeLabel={activeLabel('status')}
          isOpen={openDropdown === 'status'}
          onToggle={() =>
            setOpenDropdown((prev) => (prev === 'status' ? null : 'status'))
          }
          onClear={() => clearFilter('status')}
        >
          <ul className="py-1">
            {STATUSES.map((s) => (
              <li key={s.value}>
                <button
                  type="button"
                  onClick={() => setFilter('status', s.value)}
                  className={`flex w-full items-center px-3 py-2 text-sm transition-colors hover:bg-zinc-50 ${
                    filters.status === s.value ? 'font-semibold text-zinc-900' : 'text-zinc-600'
                  }`}
                >
                  {s.label}
                  {filters.status === s.value && (
                    <span className="ml-auto text-zinc-400">✓</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </FilterChip>

        {hasAnyActive && (
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-1 rounded-full border border-zinc-200 px-3 py-1 text-xs text-zinc-500 transition-colors hover:border-zinc-300 hover:text-zinc-700"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        )}
      </div>
    </div>
  );
}

// ---- FilterChip sub-component ----

interface FilterChipProps {
  label: string;
  activeLabel: string;
  isOpen: boolean;
  onToggle: () => void;
  onClear: () => void;
  children: React.ReactNode;
}

function FilterChip({ label, activeLabel, isOpen, onToggle, onClear, children }: FilterChipProps) {
  const isActive = Boolean(activeLabel);

  return (
    <div className="relative">
      <div
        className={`flex items-center rounded-full border text-xs transition-colors ${
          isActive
            ? 'border-zinc-900 bg-zinc-900 text-white'
            : 'border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300'
        }`}
      >
        <button
          type="button"
          onClick={onToggle}
          className="flex items-center gap-1.5 py-1.5 pl-3 pr-2"
        >
          <span>{isActive ? activeLabel : label}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          />
        </button>
        {isActive && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            aria-label={`Clear ${label} filter`}
            className="border-l border-zinc-700 py-1.5 pl-1.5 pr-2 hover:text-zinc-300"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 top-full z-50 mt-1.5 min-w-36 rounded-xl border border-zinc-200 bg-white shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}
