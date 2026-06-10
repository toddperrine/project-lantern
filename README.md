# Story World Engine

Story World Engine is a local-first MVP for creators who want to upload a world bible, upload character profiles, add a story seed, and generate an original short story that follows the uploaded canon.

The app uses OpenAI when `OPENAI_API_KEY` is configured. If no key is present, it automatically falls back to a deterministic local generator so the MVP still runs without external services.

## Project Structure

```text
story-world-engine/
|- src/
|  |- app/
|  |  |- api/generate/route.ts    # Story generation API route
|  |  |- globals.css              # Tailwind and global styles
|  |  |- layout.tsx               # App shell and metadata
|  |  `- page.tsx                 # Upload UI and story output
|  `- lib/
|     |- fallback-generator.ts    # Deterministic fallback story generator
|     |- openai-generator.ts      # Official OpenAI Node SDK integration
|     |- story-analysis.ts        # Metadata extraction helpers
|     `- types.ts                 # Shared request/response types
|- public/
|  `- sample-content/
|     |- world.md                 # Space Cowboy world bible
|     |- characters.md            # Space Cowboy character profiles
|     |- story_generation_rules.md
|     `- story_seed.md
|- .env.example                   # Environment variable template
|- package.json
|- tailwind.config.ts
`- tsconfig.json
```

## Features

- Upload a World Bible as `.md` or `.txt`
- Upload Character Profiles as `.md` or `.txt`
- Load the included Space Cowboy sample world without manual uploads
- Enter a Story Seed
- Generate a 1500-2000 word literary short story
- Preserve world rules, character consistency, tone, and story seed
- Display the story in the browser
- Return metadata:
  - word count
  - characters used
  - rules referenced
  - generator source
- No authentication, payments, database, AWS, voice, memory, or subscriptions

## Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

On Windows PowerShell, use:

```powershell
Copy-Item .env.example .env.local
```

Add your OpenAI API key to `.env.local`:

```bash
OPENAI_API_KEY=your_api_key_here
```

Optionally choose a different OpenAI model:

```bash
OPENAI_MODEL=gpt-4.1-mini
```

If `OPENAI_API_KEY` is missing or empty, the API route uses the deterministic fallback generator.

## Run Locally

Start the development server:

```bash
npm run dev
```

Open the app:

```text
http://localhost:3000
```

## Useful Commands

```bash
npm run typecheck
npm run build
npm run lint
```

## Architecture Notes

The frontend reads uploaded `.md` and `.txt` files in the browser and sends their text content to `/api/generate` with the story seed.

The API route validates the payload, checks for `OPENAI_API_KEY`, and chooses one of two generation paths:

1. OpenAI-powered generation through the official `openai` Node SDK.
2. Deterministic local fallback generation when no key is configured or the OpenAI request fails.

The response shape remains stable for both paths:

```ts
{
  story: string;
  metadata: {
    wordCount: number;
    charactersUsed: string[];
    rulesReferenced: string[];
    source: "openai" | "fallback";
  };
}
```
