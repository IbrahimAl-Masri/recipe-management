'use client';

import { Clock, ChefHat, Utensils } from 'lucide-react';
import { StatusBadge, type RecipeStatus } from './StatusBadge';

export type Difficulty = 'easy' | 'medium' | 'hard';

export interface Recipe {
  id: string;
  title: string;
  cuisineType: string;
  prepTime: number;
  cookTime: number;
  difficulty: Difficulty;
  status: RecipeStatus;
  coverImage?: string;
}

interface RecipeCardProps {
  recipe: Recipe;
  onClick?: () => void;
}

const difficultyConfig: Record<Difficulty, { label: string; className: string }> = {
  easy: { label: 'Easy', className: 'text-green-600' },
  medium: { label: 'Medium', className: 'text-yellow-600' },
  hard: { label: 'Hard', className: 'text-red-600' },
};

export function RecipeCard({ recipe, onClick }: RecipeCardProps) {
  const { title, cuisineType, prepTime, cookTime, difficulty, status, coverImage } = recipe;
  const totalTime = prepTime + cookTime;
  const diff = difficultyConfig[difficulty];

  return (
    <div
      onClick={onClick}
      className={`group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Cover image */}
      <div className="relative h-48 bg-zinc-100">
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImage}
            alt={title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Utensils className="h-12 w-12 text-zinc-300" />
          </div>
        )}
        <div className="absolute right-3 top-3">
          <StatusBadge status={status} />
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 p-4">
        <div>
          <h3 className="line-clamp-1 text-lg font-semibold leading-tight text-zinc-900">
            {title}
          </h3>
          <p className="mt-0.5 text-sm text-zinc-500">{cuisineType}</p>
        </div>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-1.5 text-zinc-600">
            <Clock className="h-4 w-4 text-zinc-400" />
            <span>{totalTime} min</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ChefHat className="h-4 w-4 text-zinc-400" />
            <span className={`font-medium ${diff.className}`}>{diff.label}</span>
          </div>
        </div>

        {/* Prep / Cook breakdown */}
        <div className="flex gap-3 border-t border-zinc-100 pt-3 text-xs text-zinc-400">
          <span>Prep: {prepTime} min</span>
          <span>·</span>
          <span>Cook: {cookTime} min</span>
        </div>
      </div>
    </div>
  );
}
