import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { RecipeForm } from '@/components/RecipeForm';

export const metadata = {
  title: 'New Recipe',
};

export default async function NewRecipePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">

        {/* Breadcrumb */}
        <nav
          aria-label="Breadcrumb"
          className="mb-6 flex items-center gap-2 text-sm text-zinc-500"
        >
          <Link
            href="/recipes"
            className="transition-colors hover:text-zinc-800"
          >
            Recipes
          </Link>
          <span aria-hidden="true" className="text-zinc-300">›</span>
          <span className="font-medium text-zinc-900">New Recipe</span>
        </nav>

        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            New Recipe
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Fill in the details below to add a recipe to your collection.
          </p>
        </div>

        <RecipeForm />
      </div>
    </div>
  );
}
