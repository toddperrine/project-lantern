# Story World Engine

Story World Engine is a local-first MVP for creators who want to upload a world bible, character profiles, a story seed, and narrative generation rules, then generate an original short story that follows the uploaded canon.

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
|     |- story_seed.md            # Sample story request
|     `- story_generation_rules.md # Sample narrative constraints
|- .env.example                   # Environment variable template
|- next.config.mjs                # Next.js configuration
|- package.json
|- tailwind.config.ts
|- vercel.json                    # Vercel deployment configuration
`- tsconfig.json
```

## Features

- Upload a World Bible as `.md` or `.txt`
- Upload Character Profiles as `.md` or `.txt`
- Upload a Story Seed as `.md` or `.txt`
- Upload Story Generation Rules / Narrative Constraints as `.md` or `.txt`
- Display uploaded filenames and character counts for all four artifacts
- Load the included Space Cowboy sample artifacts without manual uploads:
  - `world.md`
  - `characters.md`
  - `story_seed.md`
  - `story_generation_rules.md`
- Generate a 1500-2000 word literary short story
- Preserve world rules, character consistency, story request, and narrative constraints
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

## Deploy To Vercel

Story World Engine is configured for Vercel with `vercel.json`.

1. Import the repository into Vercel.
2. Choose the Next.js framework preset if Vercel does not detect it automatically.
3. Set the production environment variables:

```text
OPENAI_API_KEY=your_api_key_here
OPENAI_MODEL=gpt-4.1-mini
```

`OPENAI_API_KEY` is required for OpenAI-powered story generation in production. If it is not set, the app still deploys and uses the deterministic fallback generator.

Vercel build settings:

```text
Install Command: npm install
Build Command: npm run build
Development Command: npm run dev
```

After deployment, generate a story and check the metadata panel. It reports:

- OpenAI Enabled
- OPENAI_API_KEY detected
- Model requested
- OpenAI Attempted
- OpenAI Succeeded
- Fallback Reason

If `Generator source` is `fallback`, confirm `OPENAI_API_KEY` is configured for the same Vercel environment you deployed, such as Production or Preview.

## Architecture Notes

The frontend reads uploaded `.md` and `.txt` files in the browser and sends their text content to `/api/generate` as four fields:

```ts
{
  worldBible: string;
  characterProfiles: string;
  storySeed: string;
  storyRules: string;
}
```

The OpenAI path builds its prompt from four clearly separated internal sections:

- `WORLD BIBLE`
- `CHARACTERS`
- `STORY REQUEST`
- `NARRATIVE RULES`

Those sections are source material only. The model is instructed not to reproduce section labels, prompt text, bullet lists, or file contents verbatim. Narrative rules guide generation and take priority over generic literary defaults.

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
    diagnostics: {
      openAIEnabled: boolean;
      apiKeyDetected: boolean;
      modelRequested: string;
      openAIRequestAttempted: boolean;
      openAIRequestSucceeded: boolean;
      fallbackReason: string | null;
    };
  };
}
```
