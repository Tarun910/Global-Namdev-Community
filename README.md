# Global Namdev Community

Verified digital platform for the Global Namdev Community — census registration, community map, forum, bulletins, and digital ID cards.

## Prerequisites

- Node.js 18+

## Run locally

1. Install dependencies:
   ```bash
   npm install
   ```
2. Start the dev server:
   ```bash
   npm run dev
   ```
3. Open [http://localhost:3000](http://localhost:3000)

## Scripts

- `npm run dev` — start development server
- `npm run build` — production build
- `npm run preview` — preview production build
- `npm run lint` — type check

## Supabase (optional)

When `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are set in `.env`, the app syncs members, bulletins, forum, and admin accounts to Supabase instead of browser localStorage.

1. Create a [Supabase](https://supabase.com) project.
2. Open **SQL Editor** and run the migration in `supabase/migrations/001_initial_schema.sql`.
3. Add your project URL and anon key to `.env` (see `.env.example`).
4. Restart `npm run dev`. On first load, demo seed data is inserted if tables are empty.

**Default admin (after migration):** `superadmin` / `password123` — change this in production.

Without Supabase env vars, the app continues to use localStorage (same as before).

## Deploy on Vercel

1. Push this repo to GitHub (or deploy with the Vercel CLI).
2. Import the project at [vercel.com/new](https://vercel.com/new).
3. Framework preset: **Vite** (auto-detected).
4. Add **Environment Variables** (Production + Preview):

   | Name | Notes |
   |------|--------|
   | `VITE_MSG91_WIDGET_ID` | MSG91 widget ID |
   | `VITE_MSG91_TOKEN_AUTH` | MSG91 widget token |
   | `MSG91_AUTH_KEY` | Server-only auth key |
   | `VITE_SUPABASE_URL` | Supabase project URL |
   | `VITE_SUPABASE_ANON_KEY` | Supabase publishable key |
   | `VITE_SUPABASE_USE_PROXY` | `false` |

5. Deploy. OTP API routes are served from `/api/otp/*` via Vercel serverless functions.

CLI deploy:

```bash
npx vercel --prod
```
