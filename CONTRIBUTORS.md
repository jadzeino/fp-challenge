# Contributing

## Getting started

Follow the [new developer guide](solution.md#getting-started--new-developer-guide) in `solution.md` for prerequisites, first run, and the step-by-step on adding a feature, package, or new app.

## Workflow

1. **Branch** off `main` using the pattern `<type>/<short-description>` (e.g. `feat/accounts-filter`, `fix/auth-refresh`).
2. **Commit** using [Conventional Commits](https://www.conventionalcommits.org/): `feat:`, `fix:`, `chore:`, `perf:`, `docs:`, `test:`, `ci:`, scoped per package where relevant (`fix(auth-client): ...`).
3. **Open a PR** — CI runs `nx affected` automatically. Only packages touched by the PR are tested.
4. **Review** — at least one approval required before merge.
5. **Merge** to `main` via squash or merge commit (no force-push to main).

## Code standards

- TypeScript strict mode everywhere.
- All MUI imports must be deep paths (`@mui/material/Button`, not `@mui/material`). The ESLint rule enforces this and will fail CI if violated.
- Every shared package must have at least one test.
- No `console.log` in library packages — use `@raisin/observability` logger.
- Run `pnpm nx run-many --target=lint --fix` before pushing to auto-fix formatting.

## Adding a package or app

See the step-by-step guides in [solution.md](solution.md):
- [Adding a new shared package](solution.md#adding-a-new-shared-package)
- [Adding a new app](solution.md#adding-a-new-app)

## AI-assisted development

AI tools (e.g. Claude, GitHub Copilot) are welcome as productivity accelerators. The author is responsible for understanding, reviewing, and owning every line committed — AI-generated code that isn't understood is a liability. Do not commit `Co-Authored-By` AI attribution lines.

## Contributors

| Name | Role |
|---|---|
| Ahmed Zeno ([@jadzeino](https://github.com/jadzeino)) | Author |
