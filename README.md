# Aspire — Recipe Management

A personal recipe collection app built with Next.js, Supabase, and Tailwind CSS. Organise your recipes, track which ones you've made, and share them with others via a public link.

## Features

- **Authentication** — Email/password sign-in and sign-up via Supabase Auth
- **Recipe collection** — Browse your recipes in a card grid with cover images, cuisine type, difficulty, and status badges
- **Status tracking** — Tag each recipe as *Favorite*, *To Try*, or *Made Before*
- **Search & filtering** — Filter by status, difficulty, and cuisine type with a live search bar
- **Recipe detail** — View ingredients, step-by-step instructions, prep/cook times, and servings
- **Create & edit** — Full recipe form with all fields including cover image URL
- **Public sharing** — Generate a shareable link for any recipe; recipients can view the full recipe without an account

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js](https://nextjs.org) (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Database & Auth | [Supabase](https://supabase.com) |
| Deployment | [Vercel](https://vercel.com) |

## Database (Supabase)

All data is managed in Supabase. The schema consists of five tables:

- **`profiles`** — User profile data (`id`, `email`, `full_name`, `avatar_url`)
- **`recipes`** — Core recipe data (`title`, `description`, `cuisine_type`, `prep_time_minutes`, `cook_time_minutes`, `servings`, `difficulty`, `status`, `cover_image_url`, `is_public`)
- **`ingredients`** — Ingredients per recipe (`name`, `quantity`, `unit`)
- **`instructions`** — Ordered steps per recipe (`step_number`, `content`)
- **`recipe_shares`** — Share tokens for public recipe links (`share_token`, `is_public_link`)

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/
│   │   ├── recipes/          # Recipe list, detail, create/edit
│   │   └── shared/[token]/   # Public shared recipe view
│   ├── login/                # Auth page
│   └── page.tsx              # Root redirect → /login
├── components/
│   ├── RecipeCard.tsx
│   ├── RecipeForm.tsx
│   ├── SearchBar.tsx
│   ├── IngredientList.tsx
│   ├── ShareModal.tsx
│   └── StatusBadge.tsx
└── lib/
    └── supabase/             # Supabase client (browser + server)
```

## Getting Started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) project with the schema above
- A [Vercel](https://vercel.com) account (for deployment)

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### Run Locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Deployment

This app is deployed on Vercel. Connect your repository in the Vercel dashboard and add the environment variables above under **Project Settings → Environment Variables**. Vercel will automatically build and deploy on every push to the main branch.
