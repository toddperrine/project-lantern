# AGENTS.md

## Project Lantern

### Repository

- Repository: toddperrine/project-lantern
- Aurokey Splash is sunset and must not be used.
- All work should target Project Lantern only.

### Workflow

- Use the connected GitHub repository workflow.
- Do not use local shell commands unless explicitly requested.
- Do not use local worktrees unless explicitly requested.
- Do not use PowerShell unless explicitly requested.
- Do not depend on local filesystem paths.
- Inspect, edit, commit, push, and open PRs through GitHub-connected tools.

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

Before marking a PR complete:

- Confirm the app builds.
- Confirm Vercel preview succeeds.
- Confirm existing functionality remains intact.
- Confirm version badge is visible and updated.

### Versioning

- Every user-facing feature change must increment the visible version badge.
- Version changes should be included in the same PR as the feature.

### Build Discipline

- Do not mark a task complete if Vercel deployment fails.
- Fix build and type errors before requesting review.

### Story System Direction

- Favor recommendation, discovery, and personalization over manual story construction.
- New-reader experiences should minimize required inputs.
- Advanced controls should remain available for power users.
