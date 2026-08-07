# Open Exercise DB

An open, curated database of strength, mobility, and conditioning exercises.
Public domain, one JSON file per exercise, validated by CI on every pull request.

This project started as a successor to
[free-exercise-db](https://github.com/yuhonas/free-exercise-db), which is public
domain (Unlicense) and no longer active. It keeps that dataset's 870+ exercises
and images, and adds a curation layer on top:

- **Exercise families** — one broad movement per family. Every squat variant —
  sumo, front, single-leg, box — belongs to the one squat family, with a
  controlled body-region category per family and an optional `variantGroup`
  label for finer sub-grouping inside it.
- **Measurement type** — how a set of this exercise is measured (`weight_reps`,
  `reps`, `time`, …). Intrinsic to the movement. An exercise without one is a
  draft.
- **Laterality** — bilateral or unilateral, so apps can track left/right sides.
- **Demo videos** — a YouTube URL per exercise.
- **Aliases** — alternative English names for the same movement, so search
  matches common phrasings. The catalogue is English-only by design;
  translation belongs to consuming apps.
- **A richer equipment vocabulary** — the upstream `other` bucket resolved into
  real equipment types (trap bar, sled, suspension trainer, …).

## Repository layout

```
schema/     JSON Schema for exercise and family files
vocab/      Controlled vocabularies (muscles, equipment, categories, …)
exercises/  One JSON file per exercise, named by slug
families/   One JSON file per family, named by slug
images/     Exercise photos: images/<exercise-id>/<n>.jpg
scripts/    Validation and build tooling
```

Fields whose values must come from a vocabulary are marked with `x-vocab` in the
schema; validation checks membership against the matching file in `vocab/`.
Adding a vocabulary value is a data change, not a code change.

## Consuming the data

Each release ships `exercises.json` — every exercise merged into a single
array, with derived fields (such as loaded joint regions) computed at build
time. Consume releases, not `main`. Released ids are stable and a set
measurement type never changes: CI compares every change against the latest
release and fails on a violation, so consumers can take the newest release
without fear of orphaned references.

## Contributing

Every change lands as a pull request. CI validates schema conformance, unique
ids, resolvable family references, vocabulary membership, and image paths, so
review is about content, not structure. You can propose a new exercise without
touching JSON by opening a "New exercise" issue — an action turns it into a
pull request.

## License

[Unlicense](LICENSE) — public domain. The exercise data and images originate
from free-exercise-db (also Unlicense). Attribution is appreciated, not
required.
