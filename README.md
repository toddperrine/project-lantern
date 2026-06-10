# Story World Engine

Story World Engine is a local-development MVP web application for creators who want to upload canon documents and generate original short stories that stay aligned with a fictional world.

## Project Structure

```text
.
├── src
│   ├── app
│   │   ├── api/generate/route.ts   # Local generation API route
│   │   ├── globals.css             # Tailwind and global app styles
│   │   ├── layout.tsx              # Root layout and metadata
│   │   └── page.tsx                # Landing page and app shell
│   ├── components
│   │   ├── FileDrop.tsx            # Reusable .md/.txt upload control
│   │   └── StoryWorkspace.tsx      # Creator workflow and story display
│   ├── lib
│   │   ├── storyGenerator.ts       # Deterministic MVP story generation pipeline
│   │   ├── text.ts                 # Text helpers
│   │   └── worldParser.ts          # World/character parsing helpers
│   └── types
│       └── story.ts                # Request/response types
├── package.json
├── postcss.config.mjs
├── eslint.config.mjs
├── next.config.ts
└── tsconfig.json
```

## Features

- Upload a World Bible as `.md` or `.txt`.
- Upload Character Profiles as `.md` or `.txt`.
- Enter a free-form Story Seed.
- Generate and display a 1500–2000 word short story in the browser.
- Maintain consistency by extracting character names, character notes, world rules, and setting details from the uploaded files.
- No authentication, payments, database, AWS, or external story-generation service required.

## Setup Instructions

Install dependencies:

```bash
npm install
```

## Run Instructions

Start the local development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Useful Commands

```bash
npm run typecheck
npm run build
```

## Local Architecture Notes

The app reads uploaded files in the browser, sends their text plus the story seed to a Next.js API route, and uses a deterministic local generator to build a draft. This keeps the MVP simple and private for local development while leaving a clean seam for replacing `src/lib/storyGenerator.ts` with an LLM-backed implementation later.
