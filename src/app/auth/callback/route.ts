import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Handles the redirect after Supabase sends a confirmation / magic-link email.
 * Exchanges the one-time `code` query param for a full session, then sends
 * the user to their recipe collection.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/recipes`);
    }
  }

  // Code missing or exchange failed — send back to login
  return NextResponse.redirect(`${origin}/login`);
}
