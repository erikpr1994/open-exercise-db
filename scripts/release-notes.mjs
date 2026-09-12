// Emits a markdown "Data changes" section for release notes: the built
// dist/exercises.json compared against the latest published release.
// Removed ids are annotated with their tombstone reason from
// removed-exercises.json. Run after `npm run build`.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const MODIFIED_LIST_CAP = 50;

export function computeDataChanges(current, released) {
  const releasedById = new Map(released.map((exercise) => [exercise.id, exercise]));
  const currentById = new Map(current.map((exercise) => [exercise.id, exercise]));

  const added = current.filter((exercise) => !releasedById.has(exercise.id));
  const removed = released.filter((exercise) => !currentById.has(exercise.id));
  const modified = [];
  for (const exercise of current) {
    const before = releasedById.get(exercise.id);
    if (!before) continue;
    const fields = [...new Set([...Object.keys(before), ...Object.keys(exercise)])]
      .filter((field) => JSON.stringify(before[field]) !== JSON.stringify(exercise[field]))
      .sort();
    if (fields.length > 0) modified.push({ id: exercise.id, fields });
  }

  return { added, removed, modified };
}

export function formatDataChanges(current, added, removed, modified, tombstones) {
  const lines = ["## Data changes", ""];
  lines.push(
    `${current.length} exercises: ${added.length} added, ${removed.length} removed, ${modified.length} modified.`,
  );
  if (added.length > 0) {
    lines.push("", "### Added", "");
    for (const exercise of added) lines.push(`- \`${exercise.id}\``);
  }
  if (removed.length > 0) {
    lines.push("", "### Removed", "");
    for (const exercise of removed) {
      lines.push(`- \`${exercise.id}\` — ${tombstones.get(exercise.id) ?? "no tombstone reason recorded"}`);
    }
  }
  if (modified.length > 0) {
    lines.push("", "### Modified", "");
    for (const { id, fields } of modified.slice(0, MODIFIED_LIST_CAP)) {
      lines.push(`- \`${id}\`: ${fields.join(", ")}`);
    }
    if (modified.length > MODIFIED_LIST_CAP) {
      lines.push(`- …and ${modified.length - MODIFIED_LIST_CAP} more`);
    }
  }
  return lines.join("\n");
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const ROOT = fileURLToPath(new URL("..", import.meta.url));
  const RELEASED_URL =
    "https://github.com/erikpr1994/open-exercise-db/releases/latest/download/exercises.json";

  const current = JSON.parse(readFileSync(join(ROOT, "dist", "exercises.json"), "utf8"));

  const response = await fetch(RELEASED_URL);
  if (response.status === 404) {
    console.log(`## Data changes\n\nFirst release: ${current.length} exercises.`);
    process.exit(0);
  }
  if (!response.ok) throw new Error(`${RELEASED_URL} answered ${response.status}`);
  const released = await response.json();

  const tombstones = new Map(
    JSON.parse(readFileSync(join(ROOT, "removed-exercises.json"), "utf8")).map((entry) => [
      entry.id,
      entry.reason,
    ]),
  );

  const { added, removed, modified } = computeDataChanges(current, released);
  console.log(formatDataChanges(current, added, removed, modified, tombstones));
}
