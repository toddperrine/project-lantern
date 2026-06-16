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

## Standard Workflow

- Use Project Lantern / Story World Engine only.
- Use the GitHub/Codex cloud PR workflow for repo changes.
- Do not attempt local filesystem execution, localhost testing, or local dev-server validation unless the task explicitly requests it.
- Do not block tasks because local sandbox or tooling is unavailable.
- Make focused changes, open one draft PR, and rely on GitHub/Vercel Preview checks as the validation path.
- In PR validation notes, say Vercel/GitHub checks are the validation path.
- Avoid repeating local sandbox warnings unless there is a real repo, GitHub, or Vercel blocker.

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
- Use GitHub/Vercel Preview checks as the standard validation path when a PR is opened.

## PR Expectations

Open draft PRs by default.

Each draft PR should include:

- Summary of what changed.
- Validation notes that identify Vercel/GitHub checks as the validation path.
- Any known limitations or intentionally deferred work.

Keep PR descriptions clear enough that future Codex runs can understand the product reason, not just the file diff.
