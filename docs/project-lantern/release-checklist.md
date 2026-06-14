# Release Checklist

Use this checklist to keep Project Lantern releases aligned with the product north star.

## Product North Star

- Project Lantern is still presented as personalized episodic entertainment.
- Living Series remains the core object.
- Users are treated as story shapers, not authors.
- The UI still feels like a streaming app, not a writing tool.
- Make This Mine remains the primary personalization action.

## Core Loop

Confirm the release supports the core loop:

Create Living Series -> Add Cast/World -> Create Episode -> Save/Favorite -> Continue Series -> Return Later.

Check that the release does not make any step harder to find, harder to understand, or less reliable.

## Experience Review

- Living Series entry points are clear.
- Cast and world setup feel guided and approachable.
- Episode creation feels like starting or continuing entertainment, not filling out a writing form.
- Save and Favorite actions are understandable.
- Continue Series is easy to find.
- Returning later preserves enough context to resume.

## Technical Review

- App functionality changed only where intended.
- UI behavior changed only where intended.
- Story generation logic changed only where intended.
- Persistence changed only where intended.
- AWS and Vercel configuration changed only where intended.
- Repo and package names were not changed.

## Codex Workflow Review

- One GitHub Issue mapped to one Codex task.
- The work produced one focused draft PR.
- The PR summary explains the product intent.
- Validation notes are included.
- Unrelated cleanup was avoided.

## Documentation Review

- Product docs still agree with the current behavior.
- Roadmap language still points toward Living Series and the core loop.
- Glossary terms are used consistently.
- Any new concepts are documented before they become implementation assumptions.
