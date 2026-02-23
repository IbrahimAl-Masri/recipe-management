'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Globe,
  Link2,
  Loader2,
  Lock,
  X,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createClient } from '@/lib/supabase/client';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface ShareModalProps {
  recipeId: string;
  recipeTitle: string;
  /** Current value of recipes.is_public for this recipe. */
  initialIsPublic: boolean;
  onClose: () => void;
  /** Called after a successful visibility toggle so the parent can sync state. */
  onVisibilityChange?: (isPublic: boolean) => void;
}

// ── ShareModal ─────────────────────────────────────────────────────────────────

export function ShareModal({
  recipeId,
  recipeTitle,
  initialIsPublic,
  onClose,
  onVisibilityChange,
}: ShareModalProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [shareToken, setShareToken] = useState<string | null>(null);
  const [loadingToken, setLoadingToken] = useState(true);
  const [togglingVisibility, setTogglingVisibility] = useState(false);
  const [generatingLink, setGeneratingLink] = useState(false);
  const [copied, setCopied] = useState(false);
  // origin is captured client-side to avoid SSR/hydration mismatch
  const [origin, setOrigin] = useState('');

  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const shareUrl =
    shareToken && origin ? `${origin}/shared/${shareToken}` : null;

  // ── Effects ──────────────────────────────────────────────────────────────────

  // Capture origin after mount (window not available during SSR)
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Focus the close button when the modal opens
  useEffect(() => {
    closeButtonRef.current?.focus();
  }, []);

  // Check for an existing public share token
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('recipe_shares')
      .select('share_token')
      .eq('recipe_id', recipeId)
      .eq('is_public_link', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) console.error('[ShareModal] fetch token:', error.message);
        if (data?.share_token) setShareToken(data.share_token as string);
        setLoadingToken(false);
      });
  }, [recipeId]);

  // Close on Escape
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  // ── Handlers ─────────────────────────────────────────────────────────────────

  async function toggleVisibility() {
    const next = !isPublic;
    setIsPublic(next); // optimistic
    setTogglingVisibility(true);
    try {
      const supabase = createClient();
      const { error } = await supabase
        .from('recipes')
        .update({ is_public: next })
        .eq('id', recipeId);
      if (error) throw error;
      onVisibilityChange?.(next);
      toast.success(next ? 'Recipe is now public' : 'Recipe is now private');
    } catch (err) {
      setIsPublic(!next); // roll back optimistic update
      toast.error('Failed to update visibility');
      console.error('[ShareModal] toggleVisibility:', err);
    } finally {
      setTogglingVisibility(false);
    }
  }

  async function generateLink() {
    setGeneratingLink(true);
    try {
      const supabase = createClient();
      const token = crypto.randomUUID();
      const { error } = await supabase.from('recipe_shares').insert({
        recipe_id: recipeId,
        share_token: token,
        is_public_link: true,
      });
      if (error) throw error;
      setShareToken(token);
    } catch (err) {
      toast.error('Failed to generate link');
      console.error('[ShareModal] generateLink:', err);
    } finally {
      setGeneratingLink(false);
    }
  }

  async function copyToClipboard() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Could not copy to clipboard');
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      {/* Backdrop — click to dismiss */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-hidden="true"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-xl">

        {/* ── Header ── */}
        <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100">
              <Globe className="h-4 w-4 text-zinc-600" />
            </div>
            <div>
              <h2
                id="share-modal-title"
                className="text-sm font-semibold text-zinc-900"
              >
                Share Recipe
              </h2>
              <p className="mt-0.5 max-w-[220px] truncate text-xs text-zinc-400">
                {recipeTitle}
              </p>
            </div>
          </div>

          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-5 p-6">

          {/* ── Visibility toggle ── */}
          <div className="flex items-start justify-between gap-6">
            <div className="flex items-start gap-3">
              <div
                className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors ${
                  isPublic ? 'bg-green-100' : 'bg-zinc-100'
                }`}
              >
                {isPublic ? (
                  <Globe className="h-4 w-4 text-green-600" />
                ) : (
                  <Lock className="h-4 w-4 text-zinc-500" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-zinc-900">
                  {isPublic ? 'Public' : 'Private'}
                </p>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {isPublic
                    ? 'Anyone with a link can view this recipe.'
                    : 'Only you can see this recipe.'}
                </p>
              </div>
            </div>

            {/* Toggle switch */}
            <button
              type="button"
              role="switch"
              aria-checked={isPublic}
              aria-label="Toggle recipe visibility"
              onClick={toggleVisibility}
              disabled={togglingVisibility}
              className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 ${
                isPublic ? 'bg-zinc-900' : 'bg-zinc-200'
              }`}
            >
              <span
                className={`inline-block h-[18px] w-[18px] transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                  isPublic ? 'translate-x-5' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>

          <div className="h-px bg-zinc-100" />

          {/* ── Shareable link ── */}
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-zinc-900">Shareable link</p>
              <p className="mt-0.5 text-xs text-zinc-500">
                Anyone with this link can view the recipe — no login required.
              </p>
            </div>

            {loadingToken ? (
              <div className="flex items-center gap-2 py-1 text-sm text-zinc-400">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Checking for existing link…</span>
              </div>
            ) : shareUrl ? (
              <div className="space-y-2.5">
                {/* URL display + copy button */}
                <div className="flex items-center overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50">
                  <span className="min-w-0 flex-1 truncate px-3 py-2.5 font-mono text-xs text-zinc-600">
                    {shareUrl}
                  </span>
                  <button
                    type="button"
                    onClick={copyToClipboard}
                    aria-label="Copy link to clipboard"
                    className={`flex shrink-0 items-center gap-1.5 border-l border-zinc-200 px-3 py-2.5 text-xs font-medium transition-all ${
                      copied
                        ? 'bg-green-50 text-green-700'
                        : 'bg-white text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </>
                    )}
                  </button>
                </div>

                {/* Secondary actions: preview + regenerate */}
                <div className="flex items-center gap-3 text-xs">
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-zinc-500 transition-colors hover:text-zinc-800"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Preview
                  </a>
                  <span className="text-zinc-200" aria-hidden="true">|</span>
                  <button
                    type="button"
                    onClick={generateLink}
                    disabled={generatingLink}
                    className="flex items-center gap-1 text-zinc-500 transition-colors hover:text-zinc-800 disabled:pointer-events-none disabled:opacity-40"
                  >
                    {generatingLink && (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    )}
                    Regenerate link
                  </button>
                </div>
              </div>
            ) : (
              /* No link yet — show generate button */
              <button
                type="button"
                onClick={generateLink}
                disabled={generatingLink}
                className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generatingLink ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                    Generating…
                  </>
                ) : (
                  <>
                    <Link2 className="h-4 w-4 text-zinc-400" />
                    Generate link
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
