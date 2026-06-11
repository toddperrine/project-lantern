# Story World Engine

Story World Engine is a local-first MVP for creators who want to upload a world bible, character profiles, a story seed, and narrative generation rules, then generate an original short story that follows the uploaded canon and selected narrative architecture.

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
|     |- story-architecture-recommendations.ts # Local heuristic setting recommendations
|     |- story-output.ts          # Story response normalization helpers
|     `- types.ts                 # Shared request/response types and presets
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
- Save reusable input artifacts in a browser-local library
- Reuse saved World Bible, Character Profiles, Story Seed, and Story Rules artifacts from dropdowns
- Clear current inputs without deleting saved local library items
- Choose compact story architecture controls:
  - Genre Preset
  - Narrative Architecture
  - Character Arc
  - Ending Type
  - Length Target
- Recommend architecture settings with deterministic local heuristics
- Show recommendation explanation and confidence before applying
- Save generated stories locally in the browser
- Restore or delete saved stories
- Copy stories, copy social teasers, download `.txt`, download `.md`, and use native browser share when available
- POV is locked to third-person limited
- Load the included Space Cowboy sample artifacts without manual uploads:
  - `world.md`
  - `characters.md`
  - `story_seed.md`
  - `story_generation_rules.md`
- Generate a structurally complete literary short story against the selected length target
- Use a hidden blueprint pass before final OpenAI story drafting
- Preserve world rules, character consistency, story request, and narrative constraints
- Display the story in the browser
- Return metadata:
  - word count
  - characters used
  - rules referenced
  - generator source
  - selected architecture controls
  - expansion attempt and under-target diagnostics
  - blueprint generated, blueprint scene count, and blueprint failure reason
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

- Genre preset
- Narrative architecture
- Character arc
- Ending type
- Length target
- Final word count
- Expansion attempted
- Expansion succeeded
- Under target notice
- Blueprint generated
- Blueprint scene count
- Blueprint failed reason
- OpenAI Enabled
- OPENAI_API_KEY detected
- Model requested
- OpenAI Attempted
- OpenAI Succeeded
- Fallback Reason
- Notice

If `Generator source` is `fallback`, confirm `OPENAI_API_KEY` is configured for the same Vercel environment you deployed, such as Production or Preview.

## Architecture Notes

The frontend reads uploaded `.md` and `.txt` files in the browser. Creators can save reusable input artifacts locally in the browser and later choose them from each upload panel. Saved input artifacts include id, type, name, content, created date, updated date, and character count. They are local-only and are not sent anywhere unless the creator explicitly generates a story, which sends the selected current inputs to `/api/generate` with compact architecture controls:

```ts
{
  worldBible: string;
  characterProfiles: string;
  storySeed: string;
  storyRules: string;
  genrePreset: "Speculative Mystery" | "Literary Science Fiction" | "Contemporary Fantastical / Magical Realist";
  narrativeArchitecture: "Revelation Story" | "Event Story" | "Character Transformation Story";
  characterArc: "Positive Change Arc" | "Flat / Testing Arc" | "Disillusionment Arc";
  endingType: "Resolution with Residue" | "Revelation with Cost" | "Transformation without Victory";
  lengthTarget: "Compact" | "Standard" | "Long";
}
```

The Recommend Settings button runs deterministic local heuristics in the browser. It analyzes the uploaded world bible, character profiles, story seed, story rules, and current selections. It returns recommended architecture settings, a short explanation, and a 0-1 confidence score. No OpenAI recommendation call, database, authentication, persistent memory, or saved profile is used. The recommendation is never auto-applied; the creator must choose Apply Recommendation and can manually override every control afterward.

A future version could personalize recommendations from explicit likes/dislikes and a saved taste profile. That memory layer is intentionally not implemented in this MVP.

Saved input artifacts and saved stories are stored in browser `localStorage`. Saved stories include the finished story text and metadata such as title, created date, word count, generator source, characters used, rules referenced, selected architecture settings, length target, and diagnostics notice.

Local library items and saved stories may be lost if browser data is cleared, the user switches browsers, or local storage is reset. Library items are local-only. Phase 1 does not support backend storage, public share URLs, cloud sync, authentication, accounts, or database-backed libraries. Future versions may add authenticated cloud libraries and project folders, but that is intentionally not implemented in this MVP. Export options stay local: copy story, copy social teaser, download `.txt`, download `.md`, and native browser share when available.

The OpenAI path first creates a hidden private JSON blueprint, then writes the final story from that blueprint. The blueprint includes the protagonist, point-of-view character, central anomaly, rule under pressure, desire, fear, blind spot, architecture, arc, ending, concrete revelation, concrete cost, final decision, changed world state, and 5-9 scene beats. Each scene beat carries location, active characters, concrete action, new information, conflict or obstacle, irreversible turn, and consequence.

The blueprint is never displayed in the UI. It is used to force scene-level action before prose drafting. The final story prompt tells the model to follow the scene beats, avoid outline language, avoid making philosophical debate the main action, reveal mystery through action and consequence, include a concrete cost, include a final decision, and show a changed world state.

The OpenAI path also applies a hard forbidden-language rule unless the uploaded Story Rules explicitly allow those terms. Technical meta concepts are translated into story-world phenomena such as corrupted sound, memory gaps, impossible repetition, changed lyrics, physical glitches, missing names, wrong shadows, broken instruments, altered records, and contradictory memories.

The story must be structurally complete. It should not be a single conversation, mood piece, premise sketch, or philosophical debate. It must move through irreversible turns shaped by the selected narrative architecture.

If the first OpenAI story is below the selected target range, the app makes one expansion call focused on comparing the draft against the private blueprint and adding missing scenes, turns, costs, and consequences. It does not add filler and does not fall back solely because the story is under target. Fallback mode is reserved for technical failure: missing API key, API error, invalid response, empty story, or blueprint generation failure.

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
      notice: string | null;
      genrePreset: string;
      narrativeArchitecture: string;
      characterArc: string;
      endingType: string;
      lengthTarget: string;
      finalWordCount: number;
      expansionAttempted: boolean;
      expansionSucceeded: boolean;
      underTargetNotice: string | null;
      blueprintGenerated: boolean;
      blueprintSceneCount: number;
      blueprintFailedReason: string | null;
    };
  };
}
```
