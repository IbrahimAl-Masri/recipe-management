import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import type { Recipe } from '@/components/RecipeCard';
import type { RecipeStatus } from '@/components/StatusBadge';
import type { Difficulty } from '@/components/RecipeCard';
import { RecipesClient } from './RecipesClient';

export const metadata = {
  title: 'My Recipes',
};

export default async function RecipesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: rows, error } = await supabase
    .from('recipes')
    .select('id, title, cuisine_type, prep_time_minutes, cook_time_minutes, difficulty, status, cover_image_url')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[RecipesPage] Failed to fetch recipes:', error.message);
  }

  const recipes: Recipe[] = (rows ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    cuisineType: row.cuisine_type as string,
    prepTime: row.prep_time_minutes as number,
    cookTime: row.cook_time_minutes as number,
    difficulty: row.difficulty as Difficulty,
    status: row.status as RecipeStatus,
    coverImage: (row.cover_image_url as string | null) ?? undefined,
  }));

  return <RecipesClient initialRecipes={recipes} />;
}
