# TypeBloom

A polished typing-practice application built with the standard Next.js App
Router and ready for deployment on Vercel.

## Requirements

- Node.js `>=22.13.0`
- npm

## Local development

```bash
npm install
npx auth secret
npm run dev
```

Copy `.env.example` to `.env.local`, then add your Google OAuth Web client ID
and secret before starting the app. Open
[http://localhost:3000](http://localhost:3000). Authentication uses secure JWT
sessions and does not require a database. Personal best, recent results, and
weak-key data remain stored only in the current browser with `localStorage`.

Required variables:

```text
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

The local Google OAuth callback is:

```text
http://localhost:3000/api/auth/callback/google
```

## Production

```bash
npm run build
npm start
```

`npm run build` uses `next build` and generates the standard `.next` output
directory.

## Deploy to Vercel

Import this repository into Vercel. Vercel detects Next.js automatically, so no
custom build command or output directory is required.

The expected settings are:

- Framework preset: Next.js
- Build command: `npm run build`
- Output directory: leave empty
- Install command: `npm install`

Add all four environment variables above in Vercel. Set
`NEXT_PUBLIC_SITE_URL` to the production site URL:

```text
https://YOUR_DOMAIN
```

Register this production callback in Google Cloud, replacing the placeholder
with the exact Vercel or custom domain:

```text
https://YOUR_DOMAIN/api/auth/callback/google
```

## Practice analytics

Every completed test records final WPM, accuracy, character totals, elapsed
time, and mistaken letter keys. The results dashboard includes a personal best,
the 10 most recent tests, and a locally generated weak-key practice session.
Clearing browser site data resets this history.

## Verification

```bash
npm test
```

The test command builds the app with Next.js and verifies the typing samples,
first-keystroke timer, local progress history, personal best, results
dashboard, and weak-key practice behavior.
