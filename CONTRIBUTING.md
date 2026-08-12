# Contributing

Every change lands as a pull request. CI validates structure, so review is
about content.

## Ground rules

- **One file per exercise.** Each exercise lives at `exercises/<id>.json`,
  where `<id>` matches the `id` field. Images go in `images/<id>/`.
- **Run `npm ci` once after cloning.** It installs the dependencies and the
  git hooks (`lefthook.yml`), which validate on commit and check release
  compatibility on push. CI runs the same scripts and rejects anything they
  flag.
- **Vocabulary additions are data PRs.** If a value you need (a muscle, an
  equipment type, a level, …) is missing, add it to the matching file in
  `vocab/` in the same PR. No code change is needed. An equipment entry is an
  object with a `name` and a `loading` characteristic — how the implement
  takes external load; use `null` when no category fits.
- **The catalogue is English-only.** `aliases` holds alternative English names
  for the same movement, for search. Do not add locale data; translation
  belongs to consuming apps.
- **Families are broad movement groups.** All squat variants — sumo, front,
  single-leg, box — belong to the one squat family. Use `variantGroup` for the
  finer label inside a family.

## No-clone contributions

You can propose a new exercise without cloning the repo: open a
["New exercise" issue](https://github.com/erikpr1994/open-exercise-db/issues/new?template=new-exercise.yml)
with the issue form. The form applies the `new-exercise` label and asks for
the same fields the schema needs. A maintainer then writes
`exercises/<id>.json` from your answers and opens the pull request that
closes the issue.

All form content is English-only, like the rest of the catalogue.

The issue form is generated. Do not edit
`.github/ISSUE_TEMPLATE/new-exercise.yml` by hand; run
`npm run generate-issue-form` after a schema or vocabulary change. CI fails
when the committed form is stale.
