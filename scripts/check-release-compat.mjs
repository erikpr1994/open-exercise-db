import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const RELEASED_URL =
  'https://github.com/erikpr1994/open-exercise-db/releases/latest/download/exercises.json';

const response = await fetch(RELEASED_URL);
if (response.status === 404) {
  console.log('no release published yet — nothing to compare against');
  process.exit(0);
}
if (!response.ok) throw new Error(`${RELEASED_URL} answered ${response.status}`);
const released = await response.json();

const current = new Map();
const exercisesDir = join(ROOT, 'exercises');
for (const file of readdirSync(exercisesDir)) {
  if (!file.endsWith('.json')) continue;
  const exercise = JSON.parse(readFileSync(join(exercisesDir, file), 'utf8'));
  current.set(exercise.id, exercise);
}

const violations = [];
for (const record of released) {
  const exercise = current.get(record.id);
  if (!exercise) {
    violations.push(`released id "${record.id}" is missing — a published id must stay forever`);
    continue;
  }
  if (record.measurementType !== null && exercise.measurementType !== record.measurementType) {
    violations.push(
      `"${record.id}" changes measurementType from "${record.measurementType}" to "${exercise.measurementType}" — a set measurement type is immutable`,
    );
  }
}

if (violations.length > 0) {
  console.error(`release compatibility broken (${violations.length}):`);
  for (const violation of violations) console.error(`  ${violation}`);
  process.exit(1);
}

console.log(
  `release compatibility holds: all ${released.length} released exercises survive with their measurement types`,
);
