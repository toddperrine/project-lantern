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

In PR validation notes, state that Vercel/GitHub checks are the validation path. Avoid repeating local sandbox warnings unless there is a real repo, GitHub, or Vercel blocker.
