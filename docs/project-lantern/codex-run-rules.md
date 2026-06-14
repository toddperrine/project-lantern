# Codex Run Rules

## Project Scope

Project Lantern is personalized episodic entertainment.

The core object is the Living Series: an ongoing personalized series with cast, world, episodes, memory, favorites, and continuation.

## Product Alignment

Every Codex task should preserve the core loop:

Create Living Series -> Add Cast/World -> Create Episode -> Save/Favorite -> Continue Series -> Return Later.

When making product decisions, remember:

- Users are story shapers, not authors.
- The UI should feel like a streaming app, not a writing tool.
- Make This Mine is the primary personalization action.
- Living Series should remain the center of the experience.

## Work Rule

One GitHub Issue = one Codex task = one focused draft PR.

Do not bundle unrelated fixes, refactors, visual changes, config changes, or cleanup into the same PR.

## Default Constraints

Unless the issue explicitly asks for it:

- Do not change app functionality.
- Do not change UI behavior.
- Do not change story generation logic.
- Do not change persistence.
- Do not change AWS or Vercel configuration.
- Do not rename the repo or package.
- Do not touch `src/app/page.tsx` unless absolutely necessary.

## Documentation-Only Tasks

For documentation-only tasks:

- Add or edit only documentation files.
- Do not run formatters that rewrite application files.
- Do not change package files, lockfiles, configuration, or source code.
- Validate by reviewing the rendered markdown intent and checking that only the intended files changed.

## PR Expectations

Open draft PRs by default.

Each draft PR should include:

- Summary of what changed.
- Validation notes.
- Any known limitations or intentionally deferred work.

Keep PR descriptions clear enough that future Codex runs can understand the product reason, not just the file diff.
