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
"New exercise" issue with the issue form, and an action turns it into a pull
request.
