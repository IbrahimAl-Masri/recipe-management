import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChefHat, Clock, UtensilsCrossed, Users } from 'lucide-react';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge } from '@/components/StatusBadge';
import type { RecipeStatus } from '@/components/StatusBadge';
import type { Difficulty } from '@/components/RecipeCard';

// ── Types ──────────────────────────────────────────────────────────────────────

interface PageProps {
  params: Promise<{ token: string }>;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

const difficultyConfig: Record<
  Difficulty,
  { label: string; className: string }
> = {
  easy: {
    label: 'Easy',
    className: 'bg-green-50 text-green-700 border border-green-200',
  },
  medium: {
    label: 'Medium',
    className: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
  },
  hard: {
    label: 'Hard',
    className: 'bg-red-50 text-red-700 border border-red-200',
  },
};

// ── Metadata ──────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps) {
  const { token } = await params;
  const supabase = await createClient();

  const { data: share } = await supabase
    .from('recipe_shares')
    .select('recipe_id')
    .eq('share_token', token)
    .eq('is_public_link', true)
    .maybeSingle();

  if (!share) return { title: 'Recipe Not Found' };

  const { data: recipe } = await supabase
    .from('recipes')
    .select('title, description')
    .eq('id', share.recipe_id)
    .maybeSingle();

  return {
    title: recipe?.title
      ? `${recipe.title as string} — Shared Recipe`
      : 'Shared Recipe',
    description:
      (recipe?.description as string | null) ??
      'A recipe shared via Recipe Management.',
  };
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default async function SharedRecipePage({ params }: PageProps) {
  const { token } = await params;
  const supabase = await createClient();

  // 1. Resolve the share token
  const { data: share } = await supabase
    .from('recipe_shares')
    .select('recipe_id')
    .eq('share_token', token)
    .eq('is_public_link', true)
    .maybeSingle();

  if (!share) return notFound();

  // 2. Fetch the recipe
  const { data: recipe } = await supabase
    .from('recipes')
    .select(
      'id, title, description, cuisine_type, prep_time, cook_time, servings, difficulty, status, cover_image',
    )
    .eq('id', share.recipe_id)
    .maybeSingle();

  if (!recipe) return notFound();

  // 3. Fetch ingredients ordered by position
  const { data: ingredients } = await supabase
    .from('ingredients')
    .select('id, name, quantity, unit')
    .eq('recipe_id', share.recipe_id)
    .order('order_index', { ascending: true });

  // 4. Fetch instructions ordered by step number
  const { data: instructions } = await supabase
    .from('instructions')
    .select('id, step_number, content')
    .eq('recipe_id', share.recipe_id)
    .order('step_number', { ascending: true });

  // Derived display values
  const prepTime = recipe.prep_time as number;
  const cookTime = recipe.cook_time as number;
  const totalTime = prepTime + cookTime;
  const diff = difficultyConfig[recipe.difficulty as Difficulty];
  const hasIngredients = (ingredients ?? []).length > 0;
  const hasInstructions = (instructions ?? []).length > 0;

  return (
    <div className="min-h-screen bg-zinc-50">

      {/* ── Top banner ── */}
      <div className="border-b border-zinc-100 bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6">
          <span className="text-xs text-zinc-400">Shared recipe</span>
          <Link
            href="/recipes"
            className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Build your own collection →
          </Link>
        </div>
      </div>

      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">

        {/* ── Cover image ── */}
        {recipe.cover_image && (
          <div className="mb-8 overflow-hidden rounded-2xl border border-zinc-100">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={recipe.cover_image as string}
              alt={recipe.title as string}
              className="h-64 w-full object-cover sm:h-80"
            />
          </div>
        )}

        {/* ── Recipe header ── */}
        <header className="mb-8 space-y-4">

          {/* Status + difficulty badges */}
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={recipe.status as RecipeStatus} />
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${diff.className}`}
            >
              {diff.label}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            {recipe.title as string}
          </h1>

          {/* Cuisine + servings */}
          <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-500">
            <span>{recipe.cuisine_type as string}</span>
            {recipe.servings && (
              <>
                <span className="text-zinc-300" aria-hidden="true">·</span>
                <span className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  {recipe.servings as number}{' '}
                  {(recipe.servings as number) === 1 ? 'serving' : 'servings'}
                </span>
              </>
            )}
          </div>

          {/* Timing tiles */}
          {totalTime > 0 && (
            <div className="flex flex-wrap gap-3">
              {prepTime > 0 && (
                <TimeTile icon={<Clock className="h-4 w-4 text-zinc-500" />} label="Prep" value={`${prepTime} min`} />
              )}
              {cookTime > 0 && (
                <TimeTile icon={<ChefHat className="h-4 w-4 text-zinc-500" />} label="Cook" value={`${cookTime} min`} />
              )}
              {prepTime > 0 && cookTime > 0 && (
                <TimeTile
                  icon={<Clock className="h-4 w-4 text-white" />}
                  label="Total"
                  value={`${totalTime} min`}
                  dark
                />
              )}
            </div>
          )}
        </header>

        {/* ── Description ── */}
        {recipe.description && (
          <p className="mb-8 leading-relaxed text-zinc-700">
            {recipe.description as string}
          </p>
        )}

        {/* ── Ingredients ── */}
        {hasIngredients && (
          <section className="mb-8">
            <h2 className="mb-4 text-xl font-semibold text-zinc-900">
              Ingredients
            </h2>
            <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white">
              {(ingredients ?? []).map((ing) => (
                <li
                  key={ing.id as string}
                  className="flex items-center justify-between px-4 py-3"
                >
                  <span className="text-sm text-zinc-800">
                    {ing.name as string}
                  </span>
                  {(ing.quantity || ing.unit) && (
                    <span className="ml-4 shrink-0 text-sm text-zinc-500">
                      {[ing.quantity, ing.unit].filter(Boolean).join('\u00a0')}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* ── Instructions ── */}
        {hasInstructions && (
          <section className="mb-12">
            <h2 className="mb-4 text-xl font-semibold text-zinc-900">
              Instructions
            </h2>
            <ol className="space-y-4">
              {(instructions ?? []).map((step, index) => (
                <li key={step.id as string} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="flex-1 pt-0.5 leading-relaxed text-zinc-700">
                    {step.content as string}
                  </p>
                </li>
              ))}
            </ol>
          </section>
        )}

        {/* Empty state when neither section has data */}
        {!hasIngredients && !hasInstructions && (
          <div className="mb-12 flex flex-col items-center rounded-2xl border border-dashed border-zinc-200 bg-white py-16 text-center">
            <UtensilsCrossed className="mb-3 h-8 w-8 text-zinc-300" />
            <p className="text-sm text-zinc-400">
              No ingredients or instructions have been added yet.
            </p>
          </div>
        )}

        {/* ── Footer CTA ── */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center">
          <p className="text-sm font-medium text-zinc-800">
            Want to save and organise your own recipes?
          </p>
          <p className="mt-1 text-sm text-zinc-500">
            Create a free account and build your personal collection.
          </p>
          <Link
            href="/recipes"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
          >
            Get started →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── TimeTile ──────────────────────────────────────────────────────────────────

function TimeTile({
  icon,
  label,
  value,
  dark = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  dark?: boolean;
}) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${
          dark ? 'bg-zinc-900' : 'bg-zinc-100'
        }`}
      >
        {icon}
      </div>
      <div>
        <p className="text-xs text-zinc-400">{label}</p>
        <p className="text-sm font-medium text-zinc-900">{value}</p>
      </div>
    </div>
  );
}
