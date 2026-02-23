'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { RecipeCard, type Recipe } from '@/components/RecipeCard';
import { SearchBar, type SearchFilters } from '@/components/SearchBar';
import type { RecipeStatus } from '@/components/StatusBadge';

const STATUS_CONFIG: Record<RecipeStatus, { label: string; pillClass: string }> = {
  favorite: {
    label: 'Favorites',
    pillClass: 'bg-red-50 text-red-700 border border-red-200',
  },
  to_try: {
    label: 'To Try',
    pillClass: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  },
  made_before: {
    label: 'Made Before',
    pillClass: 'bg-green-50 text-green-700 border border-green-200',
  },
};

const STATUS_ORDER: RecipeStatus[] = ['favorite', 'to_try', 'made_before'];

interface RecipesClientProps {
  initialRecipes: Recipe[];
}

export function RecipesClient({ initialRecipes }: RecipesClientProps) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState<SearchFilters>({});

  function handleSearch(q: string, f: SearchFilters) {
    setQuery(q);
    setFilters(f);
  }

  const cuisineTypes = useMemo(() => {
    const types = new Set(initialRecipes.map((r) => r.cuisineType));
    return Array.from(types).sort();
  }, [initialRecipes]);

  const filteredRecipes = useMemo(() => {
    const lowerQuery = query.toLowerCase();
    return initialRecipes.filter((recipe) => {
      if (
        lowerQuery &&
        !recipe.title.toLowerCase().includes(lowerQuery) &&
        !recipe.cuisineType.toLowerCase().includes(lowerQuery)
      ) {
        return false;
      }
      if (filters.status && recipe.status !== filters.status) return false;
      if (filters.difficulty && recipe.difficulty !== filters.difficulty) return false;
      if (filters.cuisineType && recipe.cuisineType !== filters.cuisineType) return false;
      return true;
    });
  }, [initialRecipes, query, filters]);

  const statusCounts = useMemo(() => {
    const counts: Record<RecipeStatus, number> = { favorite: 0, to_try: 0, made_before: 0 };
    for (const recipe of initialRecipes) {
      counts[recipe.status]++;
    }
    return counts;
  }, [initialRecipes]);

  const hasRecipes = initialRecipes.length > 0;

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">My Recipes</h1>
            <p className="mt-1 text-sm text-zinc-500">
              {hasRecipes
                ? `${initialRecipes.length} recipe${initialRecipes.length !== 1 ? 's' : ''} in your collection`
                : 'Your recipe collection is empty'}
            </p>
          </div>
          <Link
            href="/recipes/new"
            className="flex shrink-0 items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            <Plus className="h-4 w-4" />
            New Recipe
          </Link>
        </div>

        {/* Status summary pills */}
        {hasRecipes && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {STATUS_ORDER.map((status) => {
              const { label, pillClass } = STATUS_CONFIG[status];
              const count = statusCounts[status];
              return (
                <span
                  key={status}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${pillClass}`}
                >
                  {label}
                  <span className="rounded-full bg-white/70 px-1.5 py-0.5 font-semibold tabular-nums">
                    {count}
                  </span>
                </span>
              );
            })}
            <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-xs font-medium text-zinc-600">
              Total
              <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 font-semibold tabular-nums">
                {initialRecipes.length}
              </span>
            </span>
          </div>
        )}

        {/* Search + Filters */}
        {hasRecipes && (
          <div className="mb-6">
            <SearchBar
              onSearch={handleSearch}
              cuisineTypes={cuisineTypes.length > 0 ? cuisineTypes : undefined}
            />
          </div>
        )}

        {/* Recipe grid or empty states */}
        {!hasRecipes ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-24 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-zinc-100">
              <Plus className="h-7 w-7 text-zinc-400" />
            </div>
            <p className="text-lg font-semibold text-zinc-700">No recipes yet</p>
            <p className="mt-1 text-sm text-zinc-400">
              Get started by adding your first recipe.
            </p>
            <Link
              href="/recipes/new"
              className="mt-6 flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
            >
              <Plus className="h-4 w-4" />
              New Recipe
            </Link>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 bg-white py-20 text-center">
            <p className="text-lg font-semibold text-zinc-700">No recipes match your search</p>
            <p className="mt-1 text-sm text-zinc-400">
              Try adjusting your filters or search term.
            </p>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-zinc-500">
              Showing {filteredRecipes.length} of {initialRecipes.length} recipes
            </p>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => router.push(`/recipes/${recipe.id}`)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
