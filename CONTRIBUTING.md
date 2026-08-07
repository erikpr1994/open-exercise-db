# Contributing

Every change lands as a pull request. CI validates structure, so review is
about content.

## Ground rules

- **One file per exercise.** Each exercise lives at `exercises/<id>.json`,
  where `<id>` matches the `id` field. Images go in `images/<id>/`.
- **Validate before you open a PR.** Run `npm ci` once, then
  `npm run validate`. CI runs the same script and rejects anything it flags.
- **Vocabulary additions are data PRs.** If a value you need (a muscle, an
  equipment type, a level, …) is missing, add it to the matching file in
  `vocab/` in the same PR. No code change is needed.
- **The catalogue is English-only.** `aliases` holds alternative English names
  for the same movement, for search. Do not add locale data; translation
  belongs to consuming apps.
- **Families are broad movement groups.** All squat variants — sumo, front,
  single-leg, box — belong to the one squat family. Use `variantGroup` for the
  finer label inside a family.

## No-clone contributions

You can propose a new exercise without cloning the repo: open a
["New exercise" issue](https://github.com/erikpr1994/open-exercise-db/issues/new?template=new-exercise.yml)
with the issue form. The form applies the `new-exercise` label, and a
workflow then:

1. Parses your answers into `exercises/<id>.json`, where `<id>` is the
   slugified name.
2. Runs the same validation as CI. When validation fails, the workflow
   comments the errors on the issue and stops. Edit the issue to fix the
   fields, then remove and re-add the `new-exercise` label to retry.
3. When validation passes, opens a pull request that closes the issue when
   it merges.

All form content is English-only, like the rest of the catalogue.

Known limitation: the workflow opens the pull request with the built-in
`GITHUB_TOKEN`, and GitHub does not trigger the CI workflow for such pull
requests. This is acceptable because the workflow already ran the same
validation before it opened the pull request.

The issue form is generated. Do not edit
`.github/ISSUE_TEMPLATE/new-exercise.yml` by hand; run
`npm run generate-issue-form` after a schema or vocabulary change. CI fails
when the committed form is stale.
