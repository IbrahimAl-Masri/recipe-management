'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());

  useEffect(() => {
    // Redirect immediately if a session already exists
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace('/recipes');
    });

    // Redirect on successful sign-in / sign-up confirmation
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        router.push('/recipes');
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-sm">

        {/* Heading */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Recipe Management
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Sign in to access your recipe collection
          </p>
        </div>

        {/* Auth card */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <Auth
            supabaseClient={supabase}
            redirectTo={
              typeof window !== 'undefined'
                ? `${window.location.origin}/auth/callback`
                : undefined
            }
            appearance={{
              theme: ThemeSupa,
              variables: {
                default: {
                  colors: {
                    brand: '#18181b',
                    brandAccent: '#3f3f46',
                  },
                  radii: {
                    borderRadiusButton: '0.75rem',
                    buttonBorderRadius: '0.75rem',
                    inputBorderRadius: '0.75rem',
                  },
                },
              },
            }}
            providers={[]}
          />
        </div>
      </div>
    </div>
  );
}
