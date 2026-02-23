'use client';

export type RecipeStatus = 'favorite' | 'to_try' | 'made_before';

interface StatusBadgeProps {
  status: RecipeStatus;
}

const statusConfig: Record<RecipeStatus, { label: string; className: string }> = {
  favorite: {
    label: 'Favorite',
    className: 'bg-red-100 text-red-700 border border-red-200',
  },
  to_try: {
    label: 'To Try',
    className: 'bg-yellow-100 text-yellow-700 border border-yellow-200',
  },
  made_before: {
    label: 'Made Before',
    className: 'bg-green-100 text-green-700 border border-green-200',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  );
}
