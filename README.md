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

Create a Google OAuth 2.0 Web application, then put its credentials in
`.env.local`:

```dotenv
AUTH_SECRET=the-secret-generated-by-npx-auth-secret
AUTH_GOOGLE_ID=your-google-client-id
AUTH_GOOGLE_SECRET=your-google-client-secret
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Add this local authorized redirect URI to the Google OAuth client:

```text
http://localhost:3000/api/auth/callback/google
```

Open [http://localhost:3000](http://localhost:3000). The typing studio is
available only after signing in with a verified Gmail account.

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

In the Vercel project settings, add `AUTH_SECRET`, `AUTH_GOOGLE_ID`, and
`AUTH_GOOGLE_SECRET` to the required environments. Set `NEXT_PUBLIC_SITE_URL`
to the production site URL. Also add the production callback URL to the Google
OAuth client:

```text
https://YOUR_DOMAIN/api/auth/callback/google
```

Keep these values private and never commit `.env.local`.

## Verification

```bash
npm test
```

The test command builds the app with Next.js and verifies the Gmail access
gate, the 100 typing samples, and the first-keystroke timer behavior.
