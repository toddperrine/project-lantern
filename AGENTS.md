# AGENTS.md

## Project Lantern

### Repository

- Repository: toddperrine/project-lantern
- Aurokey Splash is sunset and must not be used.
- All work should target Project Lantern only.

### Workflow

- For Codex Web tasks, edit only the provided cloud checkout.
- Do not access local Windows paths.
- Do not add, replace, or modify Git remotes.
- Do not run git push from the shell.
- Make one focused change only.
- Leave the completed diff ready for the Codex Create PR action.
- Do not claim that a PR exists unless the platform confirms it.

### Product Rules

- Project Lantern is a personalized entertainment platform, not a writing tool.
- Reader-first UX takes precedence over creator-first UX.
- Preserve story generation functionality unless explicitly requested otherwise.
- Preserve Continue Series functionality.
- Preserve cloud persistence.
- Preserve save/load functionality.
- Mobile-first design.

### Pull Request Rules

- One task per PR.
- One draft PR only.
- Do not bundle unrelated features.
- Keep changes as small as possible.
- Update the visible version badge whenever user-facing functionality changes.

### Protected Systems

Do not modify unless explicitly requested:

- AWS configuration
- Vercel configuration
- Model selection
- Cloud persistence architecture

### Efficiency

- Prefer editing files named in the prompt.
- Do not search the entire repository unless required.
- Ask for clarification instead of broad exploration.
- Minimize repository discovery work.

### Validation

- Run builds, typecheck, lint, or tests only when the task explicitly requests them.
- Vercel preview validation occurs after the PR is created.
- Mobile UI validation occurs on the production or preview deployment.
- Preserve unrelated pages and existing functionality.


### Versioning

- Every user-facing feature change must increment the visible version badge.
- Version changes should be included in the same PR as the feature.

### Build Discipline

- Do not attempt to inspect Vercel before a PR exists.
- Report files changed and version changes accurately.
- The user will create the PR using the Codex Create PR button.

### Story System Direction

- Favor recommendation, discovery, and personalization over manual story construction.
- New-reader experiences should minimize required inputs.
- Advanced controls should remain available for power users.
