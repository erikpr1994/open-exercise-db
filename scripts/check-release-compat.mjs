import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const IMMUTABLE_FIELDS = ["measurementType", "laterality", "directionality"];

export function compareReleases(released, current, removed, corrections) {
  const violations = [];
  let tombstoned = 0;
  let corrected = 0;

  const sanctioned = new Map(
    corrections.map((entry) => [`${entry.id}:${entry.field}`, entry]),
  );

  for (const record of released) {
    const exercise = current.get(record.id);
    if (!exercise) {
      if (removed.has(record.id)) {
        tombstoned += 1;
        continue;
      }
      violations.push(
        `released id "${record.id}" is missing — a published id must stay forever unless it is tombstoned in removed-exercises.json`,
      );
      continue;
    }
    if (removed.has(record.id)) {
      violations.push(
        `"${record.id}" is tombstoned in removed-exercises.json but exercises/${record.id}.json still exists — remove the file or the tombstone`,
      );
    }
    for (const field of IMMUTABLE_FIELDS) {
      const was = record[field];
      if (was === null || was === undefined || exercise[field] === was) continue;
      const correction = sanctioned.get(`${record.id}:${field}`);
      if (
        correction !== undefined &&
        correction.from === was &&
        correction.to === exercise[field]
      ) {
        corrected += 1;
        continue;
      }
      violations.push(
        `"${record.id}" changes ${field} from "${was}" to "${exercise[field]}" — a set ${field} changes only through a correction entry in corrected-exercises.json`,
      );
    }
  }

  return { violations, tombstoned, corrected };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const ROOT = fileURLToPath(new URL("..", import.meta.url));
  const RELEASED_URL =
    "https://github.com/erikpr1994/open-exercise-db/releases/latest/download/exercises.json";

  const removed = new Map(
    JSON.parse(readFileSync(join(ROOT, "removed-exercises.json"), "utf8")).map(
      (entry) => [entry.id, entry],
    ),
  );
  const corrections = JSON.parse(
    readFileSync(join(ROOT, "corrected-exercises.json"), "utf8"),
  );

  const response = await fetch(RELEASED_URL);
  if (response.status === 404) {
    console.log("no release published yet — nothing to compare against");
    process.exit(0);
  }
  if (!response.ok) throw new Error(`${RELEASED_URL} answered ${response.status}`);
  const released = await response.json();

  const current = new Map();
  const exercisesDir = join(ROOT, "exercises");
  for (const file of readdirSync(exercisesDir)) {
    if (!file.endsWith(".json")) continue;
    const exercise = JSON.parse(readFileSync(join(exercisesDir, file), "utf8"));
    current.set(exercise.id, exercise);
  }

  const { violations, tombstoned, corrected } = compareReleases(
    released,
    current,
    removed,
    corrections,
  );

  if (violations.length > 0) {
    console.error(`release compatibility broken (${violations.length}):`);
    for (const violation of violations) console.error(`  ${violation}`);
    process.exit(1);
  }

  console.log(
    `release compatibility holds: ${released.length - tombstoned} released exercises survive with their measurement types, lateralities and directionalities` +
      (tombstoned > 0 ? `, ${tombstoned} deliberately removed via removed-exercises.json` : "") +
      (corrected > 0 ? `, ${corrected} field(s) deliberately corrected via corrected-exercises.json` : ""),
  );
}
