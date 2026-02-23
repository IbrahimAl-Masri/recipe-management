'use client';

import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { ShareModal } from '@/components/ShareModal';

interface ShareButtonProps {
  recipeId: string;
  recipeTitle: string;
  initialIsPublic: boolean;
}

export function ShareButton({ recipeId, recipeTitle, initialIsPublic }: ShareButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPublic, setIsPublic] = useState(initialIsPublic);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50"
      >
        <Share2 className="h-4 w-4 text-zinc-400" />
        {isPublic ? 'Shared' : 'Share'}
      </button>

      {open && (
        <ShareModal
          recipeId={recipeId}
          recipeTitle={recipeTitle}
          initialIsPublic={isPublic}
          onClose={() => setOpen(false)}
          onVisibilityChange={setIsPublic}
        />
      )}
    </>
  );
}
