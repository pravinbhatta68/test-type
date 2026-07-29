# TypeBloom

A polished typing-practice application built with the standard Next.js App
Router and ready for deployment on Vercel.

## Requirements

- Node.js `>=22.13.0`
- npm

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

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

## Verification

```bash
npm test
```

The test command builds the app with Next.js and verifies the generated page,
the 100 typing samples, and the first-keystroke timer behavior.
