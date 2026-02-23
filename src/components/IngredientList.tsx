'use client';

import { Plus, Trash2 } from 'lucide-react';

export interface Ingredient {
  id: string;
  name: string;
  quantity: number | string;
  unit: string;
}

interface IngredientListProps {
  ingredients: Ingredient[];
  editMode?: boolean;
  onAdd?: () => void;
  onRemove?: (id: string) => void;
}

export function IngredientList({
  ingredients,
  editMode = false,
  onAdd,
  onRemove,
}: IngredientListProps) {
  return (
    <div className="space-y-2">
      <ul className="overflow-hidden rounded-xl border border-zinc-200 divide-y divide-zinc-100">
        {ingredients.length === 0 ? (
          <li className="flex items-center justify-center py-8 text-sm text-zinc-400">
            No ingredients yet.
          </li>
        ) : (
          ingredients.map((ingredient) => (
            <li
              key={ingredient.id}
              className="flex items-center gap-3 bg-white px-4 py-3 transition-colors hover:bg-zinc-50"
            >
              <span className="flex-1 text-sm text-zinc-800">{ingredient.name}</span>
              <span className="shrink-0 text-sm text-zinc-500">
                {ingredient.quantity} {ingredient.unit}
              </span>
              {editMode && onRemove && (
                <button
                  type="button"
                  onClick={() => onRemove(ingredient.id)}
                  className="ml-1 rounded-md p-1 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500"
                  aria-label={`Remove ${ingredient.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </li>
          ))
        )}
      </ul>

      {editMode && onAdd && (
        <button
          type="button"
          onClick={onAdd}
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 px-4 py-3 text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-700"
        >
          <Plus className="h-4 w-4" />
          Add ingredient
        </button>
      )}
    </div>
  );
}
