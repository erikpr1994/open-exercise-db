# CLAUDE.md

Open, curated exercise database. One JSON file per exercise in
`exercises/`, one per family in `families/`, controlled vocabularies in
`vocab/`, JSON Schemas in `schema/`, tooling in `scripts/`. Public domain.

## Commands

- `npm ci` — install dependencies and the git hooks (`lefthook install`
  runs through the `prepare` script).
- `npm run validate` — schema, vocabulary, family, image, and id checks.
- `npm run build` — write `dist/exercises.json` and `dist/families.json`.
- `npm test` — unit tests for the scripts (`scripts/*.test.mjs`).
- `node scripts/check-release-compat.mjs` — compare against the latest release.
- `npm run generate-issue-form` — regenerate the new-exercise issue form.
  Run it after every schema or vocabulary change; CI fails when the
  committed form is stale.

Do not run these checks by hand. The git hooks in `lefthook.yml` run them
on commit and on push. If a check is missing from the git hooks, add it
there instead of running it by hand.

## Data invariants

These rules protect consumers of the released data. Never weaken them.

- A released exercise id exists forever. To remove an exercise, add a
  tombstone entry (id, date, reason) to `removed-exercises.json` and delete
  the file in the same change.
- A set `measurementType` and a set `laterality` never change. A version of
  a movement that is measured differently is a separate exercise in the
  same family.
- Field values marked `x-vocab` must exist in the matching `vocab/` file.
  To use a new value, add it to the vocabulary in the same pull request.
- Families are broad movement groups. All squat variants belong to the one
  squat family; use `variantGroup` for finer labels.
- The catalogue is English only. `aliases` holds common alternative English
  names for search. An alias must not repeat the exercise name, and must
  not repeat the canonical name of a different exercise.
- JSON files use 2-space indentation and end with a newline. `aliases`
  goes directly after `name`.
- Releases are automatic: a merge to `main` that changes the shipped data
  publishes the next patch release. Removals and vocabulary or schema
  changes are a minor release, cut by hand through the "Auto release"
  workflow dispatch.

## Working style

- Respond in ASD-STE100 Simplified Technical English.
- Do not add comments to files by default. Make the code self-explanatory.
  If you must add a comment, ask permission first and explain why.
- Do not preserve backward compatibility in code and tooling. Remove an
  obsolete path; do not add compatibility layers, fallbacks, or migrations.
  The data is the one exception: the invariants above exist to protect
  consumers, and `check-release-compat.mjs` enforces them.
- Choose the simplest implementation that fully meets the current
  requirements. Avoid speculative abstractions, configuration, and
  indirection.
- Grow the system in layers. Start from the smallest version that works
  end to end. Never trade a working product for unfinished complexity.
- Keep components modular and concerns clearly separated.
- Prefer established, well-maintained libraries when they reduce overall
  complexity or improve reliability. Do not reimplement common
  functionality without a clear reason.
- Lean on the dependencies already in the project (`ajv`, `yaml`) before
  you write your own implementation or add a package. Do not assume a
  library lacks a capability without checking its documentation and types.
- Read the documentation of a library, framework, SDK, CLI, or cloud
  service with `npx ctx7@latest`, before you answer from memory or start a
  web search. `npx ctx7@latest library "<name>" "<question>"` gives an id
  of the form `/org/project`; `npx ctx7@latest docs <id> "<question>"`
  gives the pages. Also use it when a tool behaves in a way you did not
  expect.
- When you add a dependency, put it in the right Dependabot group in
  `.github/dependabot.yml`. If it ships as a family of packages, group the
  family so a major version moves the set in one pull request.
- Make architectural decisions for the long term. Do not accept a stopgap
  that is meant to be replaced later.
- Never silence a check. Do not weaken `validate.mjs`, the schemas, the
  vocabularies, or `check-release-compat.mjs` to make a finding go away.
  Fix the data or the design the check points at.
- When you add or change script logic, add or update its tests in
  `scripts/*.test.mjs` in the same change. Data changes need no new tests;
  validation and CI cover them.
