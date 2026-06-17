# Codex Guidance

Before starting work in this repo, read the Project Lantern docs in `docs/project-lantern/`.

Start with:

- `docs/project-lantern/product-north-star.md`
- `docs/project-lantern/codex-run-rules.md`
- `docs/project-lantern/roadmap.md`
- `docs/project-lantern/living-series-glossary.md`
- `docs/project-lantern/release-checklist.md`

Use those docs to keep implementation, review, and PR scope aligned with the Project Lantern product direction.

## Standard Workflow

Use Project Lantern / Story World Engine only.

Use the GitHub/Codex cloud PR workflow for repo changes. Do not attempt local filesystem execution, localhost testing, or local dev-server validation unless the task explicitly requests it.

Do not block tasks because local sandbox or tooling is unavailable. Make focused changes, open one draft PR, and rely on GitHub/Vercel Preview checks as the validation path.

In PR validation notes, state that Vercel/GitHub checks are the validation path. Do not list unattempted local checks as failed, skipped, or unavailable. Avoid repeating local sandbox warnings unless there is a real repo, GitHub, or Vercel blocker.

Efficiency Rules

- Prefer editing files explicitly named in the task.
- Do not search the entire repository unless required.
- Ask for clarification rather than broad repository exploration.
- Minimize repository discovery work.

Product Rules

- Project Lantern is a personalized entertainment platform, not a writing tool.
- Reader-first UX takes precedence over creator-first UX.
- Favor recommendation, discovery, and personalization over manual story construction.
- New-reader experiences should minimize required inputs.
- Advanced controls should remain available for power users.

Pull Request Rules

- One task per PR.
- One draft PR only.
- Keep changes as small as possible.
- Do not bundle unrelated features.

Validation

- Do not mark work complete if Vercel build fails.

  If local sandbox access is requested or unavailable, do not request local permissions. Continue through GitHub-connected tools only.
- Fix build/type errors before requesting review.
- Update the visible version badge when user-facing functionality changes.
