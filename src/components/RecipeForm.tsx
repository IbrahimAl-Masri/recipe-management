'use client';

import { useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Difficulty } from '@/components/RecipeCard';
import type { RecipeStatus } from '@/components/StatusBadge';

// ── Constants ──────────────────────────────────────────────────────────────────

const CUISINE_TYPES = [
  'Italian', 'Mexican', 'Asian', 'American', 'Mediterranean',
  'Indian', 'French', 'Japanese', 'Thai', 'Greek', 'Spanish', 'Other',
] as const;

const COMMON_UNITS = [
  'cups', 'tbsp', 'tsp', 'oz', 'lb', 'g', 'kg', 'ml', 'l',
  'pieces', 'cloves', 'slices', 'pinch', 'whole',
];

// ── Types ──────────────────────────────────────────────────────────────────────

interface FormFields {
  title: string;
  description: string;
  cuisineType: string;
  prepTime: string;
  cookTime: string;
  servings: string;
  difficulty: Difficulty;
  status: RecipeStatus;
  coverImage: string;
}

export interface IngredientRow {
  id: string;
  name: string;
  quantity: string;
  unit: string;
}

export interface InstructionRow {
  id: string;
  content: string;
}

export interface RecipeFormProps {
  /** Pre-populate for edit mode. All fields optional. */
  defaultValues?: Partial<FormFields>;
  defaultIngredients?: IngredientRow[];
  defaultInstructions?: InstructionRow[];
}

// ── Row factories ──────────────────────────────────────────────────────────────

function newIngredient(): IngredientRow {
  return { id: crypto.randomUUID(), name: '', quantity: '', unit: '' };
}

function newInstruction(): InstructionRow {
  return { id: crypto.randomUUID(), content: '' };
}

// ── Shared style constants ─────────────────────────────────────────────────────

const base =
  'w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder-zinc-400 outline-none transition-all focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100 disabled:opacity-50';
const inputClass = `${base} h-10`;
const textareaClass = `${base} py-2.5 resize-y`;
const selectClass = `${base} h-10 cursor-pointer`;

// ── RecipeForm ─────────────────────────────────────────────────────────────────

export function RecipeForm({
  defaultValues,
  defaultIngredients,
  defaultInstructions,
}: RecipeFormProps) {
  const router = useRouter();
  const unitListId = useId();

  const [fields, setFields] = useState<FormFields>({
    title: '',
    description: '',
    cuisineType: 'Other',
    prepTime: '',
    cookTime: '',
    servings: '',
    difficulty: 'medium',
    status: 'to_try',
    coverImage: '',
    ...defaultValues,
  });

  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    defaultIngredients ?? [newIngredient()],
  );
  const [instructions, setInstructions] = useState<InstructionRow[]>(
    defaultInstructions ?? [newInstruction()],
  );
  const [submitting, setSubmitting] = useState(false);

  // ── Field helpers ────────────────────────────────────────────────────────────

  function setField<K extends keyof FormFields>(key: K, value: FormFields[K]) {
    setFields((prev) => ({ ...prev, [key]: value }));
  }

  // ── Ingredient helpers ───────────────────────────────────────────────────────

  function updateIngredient(
    id: string,
    key: keyof Omit<IngredientRow, 'id'>,
    value: string,
  ) {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, [key]: value } : i)),
    );
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, newIngredient()]);
  }

  function removeIngredient(id: string) {
    setIngredients((prev) => {
      if (prev.length === 1) return [newIngredient()];
      return prev.filter((i) => i.id !== id);
    });
  }

  // ── Instruction helpers ──────────────────────────────────────────────────────

  function updateInstruction(id: string, content: string) {
    setInstructions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, content } : s)),
    );
  }

  function addInstruction() {
    setInstructions((prev) => [...prev, newInstruction()]);
  }

  function removeInstruction(id: string) {
    setInstructions((prev) => {
      if (prev.length === 1) return [newInstruction()];
      return prev.filter((s) => s.id !== id);
    });
  }

  function moveInstruction(index: number, direction: 'up' | 'down') {
    setInstructions((prev) => {
      const next = [...prev];
      const target = direction === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!fields.title.trim()) {
      toast.error('Recipe title is required');
      return;
    }

    setSubmitting(true);

    try {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error('Not authenticated');

      // 1. Insert the recipe row and return its id
      const { data: recipe, error: recipeError } = await supabase
        .from('recipes')
        .insert({
          title: fields.title.trim(),
          description: fields.description.trim() || null,
          cuisine_type: fields.cuisineType,
          prep_time: parseInt(fields.prepTime) || 0,
          cook_time: parseInt(fields.cookTime) || 0,
          servings: parseInt(fields.servings) || null,
          difficulty: fields.difficulty,
          status: fields.status,
          cover_image: fields.coverImage.trim() || null,
          user_id: user.id,
        })
        .select('id')
        .single();

      if (recipeError) throw recipeError;

      // 2. Insert ingredients (skip blank rows)
      const validIngredients = ingredients.filter((i) => i.name.trim());
      if (validIngredients.length > 0) {
        const { error: ingError } = await supabase.from('ingredients').insert(
          validIngredients.map((ing, idx) => ({
            recipe_id: recipe.id,
            name: ing.name.trim(),
            quantity: ing.quantity.trim() || null,
            unit: ing.unit.trim() || null,
            order_index: idx,
          })),
        );
        if (ingError) throw ingError;
      }

      // 3. Insert instructions (skip blank steps)
      const validInstructions = instructions.filter((s) => s.content.trim());
      if (validInstructions.length > 0) {
        const { error: stepError } = await supabase.from('instructions').insert(
          validInstructions.map((step, idx) => ({
            recipe_id: recipe.id,
            step_number: idx + 1,
            content: step.content.trim(),
          })),
        );
        if (stepError) throw stepError;
      }

      toast.success('Recipe saved!');
      router.push(`/recipes/${recipe.id}`);
    } catch (err) {
      console.error('[RecipeForm] submit error:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to save recipe');
      setSubmitting(false);
    }
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">

      {/* ── Basics ── */}
      <FormSection title="Basics">
        <div className="space-y-4">
          <Field label="Title" required>
            <input
              type="text"
              value={fields.title}
              onChange={(e) => setField('title', e.target.value)}
              placeholder="E.g. Spaghetti Carbonara"
              className={inputClass}
              disabled={submitting}
            />
          </Field>

          <Field label="Description">
            <textarea
              value={fields.description}
              onChange={(e) => setField('description', e.target.value)}
              placeholder="A short description of the recipe…"
              rows={3}
              className={textareaClass}
              disabled={submitting}
            />
          </Field>

          <Field label="Cover Image URL">
            <input
              type="url"
              value={fields.coverImage}
              onChange={(e) => setField('coverImage', e.target.value)}
              placeholder="https://example.com/image.jpg"
              className={inputClass}
              disabled={submitting}
            />
          </Field>
        </div>
      </FormSection>

      {/* ── Details ── */}
      <FormSection title="Details">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Cuisine Type">
            <select
              value={fields.cuisineType}
              onChange={(e) => setField('cuisineType', e.target.value)}
              className={selectClass}
              disabled={submitting}
            >
              {CUISINE_TYPES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>

          <Field label="Difficulty">
            <select
              value={fields.difficulty}
              onChange={(e) => setField('difficulty', e.target.value as Difficulty)}
              className={selectClass}
              disabled={submitting}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </Field>

          <Field label="Status">
            <select
              value={fields.status}
              onChange={(e) => setField('status', e.target.value as RecipeStatus)}
              className={selectClass}
              disabled={submitting}
            >
              <option value="to_try">To Try</option>
              <option value="favorite">Favorite</option>
              <option value="made_before">Made Before</option>
            </select>
          </Field>

          <Field label="Servings">
            <input
              type="number"
              value={fields.servings}
              onChange={(e) => setField('servings', e.target.value)}
              placeholder="4"
              min="1"
              className={inputClass}
              disabled={submitting}
            />
          </Field>
        </div>
      </FormSection>

      {/* ── Timing ── */}
      <FormSection title="Timing">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Prep Time (min)">
            <input
              type="number"
              value={fields.prepTime}
              onChange={(e) => setField('prepTime', e.target.value)}
              placeholder="15"
              min="0"
              className={inputClass}
              disabled={submitting}
            />
          </Field>

          <Field label="Cook Time (min)">
            <input
              type="number"
              value={fields.cookTime}
              onChange={(e) => setField('cookTime', e.target.value)}
              placeholder="30"
              min="0"
              className={inputClass}
              disabled={submitting}
            />
          </Field>
        </div>
      </FormSection>

      {/* ── Ingredients ── */}
      <FormSection title="Ingredients">
        <div className="mb-2 grid grid-cols-[1fr_5.5rem_7rem_2.25rem] gap-2 px-0.5 text-xs font-medium uppercase tracking-wide text-zinc-400">
          <span>Name</span>
          <span>Qty</span>
          <span>Unit</span>
          <span />
        </div>

        <div className="space-y-2">
          {ingredients.map((ing) => (
            <div
              key={ing.id}
              className="grid grid-cols-[1fr_5.5rem_7rem_2.25rem] items-center gap-2"
            >
              <input
                type="text"
                value={ing.name}
                onChange={(e) => updateIngredient(ing.id, 'name', e.target.value)}
                placeholder="Ingredient"
                className={inputClass}
                disabled={submitting}
              />
              <input
                type="text"
                value={ing.quantity}
                onChange={(e) => updateIngredient(ing.id, 'quantity', e.target.value)}
                placeholder="2"
                className={inputClass}
                disabled={submitting}
              />
              <input
                type="text"
                value={ing.unit}
                onChange={(e) => updateIngredient(ing.id, 'unit', e.target.value)}
                placeholder="cups"
                list={unitListId}
                className={inputClass}
                disabled={submitting}
              />
              <button
                type="button"
                onClick={() => removeIngredient(ing.id)}
                aria-label="Remove ingredient"
                disabled={submitting}
                className="flex h-10 w-9 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:pointer-events-none disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Datalist for unit autocomplete — shared across all unit inputs */}
        <datalist id={unitListId}>
          {COMMON_UNITS.map((u) => (
            <option key={u} value={u} />
          ))}
        </datalist>

        <button
          type="button"
          onClick={addIngredient}
          disabled={submitting}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 py-3 text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 disabled:pointer-events-none disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          Add ingredient
        </button>
      </FormSection>

      {/* ── Instructions ── */}
      <FormSection title="Instructions">
        <div className="space-y-3">
          {instructions.map((step, index) => (
            <div key={step.id} className="flex gap-3">

              {/* Step badge + reorder controls */}
              <div className="flex shrink-0 flex-col items-center gap-0.5 pt-2">
                <span className="mb-1 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs font-bold text-white">
                  {index + 1}
                </span>
                <button
                  type="button"
                  onClick={() => moveInstruction(index, 'up')}
                  disabled={index === 0 || submitting}
                  aria-label={`Move step ${index + 1} up`}
                  className="rounded-md p-0.5 text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-600 disabled:pointer-events-none disabled:opacity-30"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveInstruction(index, 'down')}
                  disabled={index === instructions.length - 1 || submitting}
                  aria-label={`Move step ${index + 1} down`}
                  className="rounded-md p-0.5 text-zinc-300 transition-colors hover:bg-zinc-100 hover:text-zinc-600 disabled:pointer-events-none disabled:opacity-30"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Step textarea */}
              <textarea
                value={step.content}
                onChange={(e) => updateInstruction(step.id, e.target.value)}
                placeholder={`Describe step ${index + 1}…`}
                rows={2}
                className={`${textareaClass} flex-1`}
                disabled={submitting}
              />

              {/* Remove step */}
              <button
                type="button"
                onClick={() => removeInstruction(step.id)}
                aria-label={`Remove step ${index + 1}`}
                disabled={submitting}
                className="mt-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:pointer-events-none disabled:opacity-40"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={addInstruction}
          disabled={submitting}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 py-3 text-sm text-zinc-500 transition-colors hover:border-zinc-400 hover:bg-zinc-50 hover:text-zinc-700 disabled:pointer-events-none disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
          Add step
        </button>
      </FormSection>

      {/* ── Actions ── */}
      <div className="flex items-center justify-end gap-3 pb-8">
        <button
          type="button"
          onClick={() => router.back()}
          disabled={submitting}
          className="rounded-xl border border-zinc-200 px-5 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:pointer-events-none disabled:opacity-40"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex min-w-[7.5rem] items-center justify-center gap-2 rounded-xl bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Saving…
            </>
          ) : (
            'Save Recipe'
          )}
        </button>
      </div>
    </form>
  );
}

// ── Shared sub-components ──────────────────────────────────────────────────────

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h2 className="mb-5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
        {title}
      </h2>
      {children}
    </section>
  );
}

interface FieldProps {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}

function Field({ label, required, children }: FieldProps) {
  return (
    <div className="space-y-1.5">
      <label className="block text-sm font-medium text-zinc-700">
        {label}
        {required && (
          <span className="ml-0.5 text-red-500" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children}
    </div>
  );
}
