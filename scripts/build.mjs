import { existsSync } from "node:fs";
import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

const REGIONS = [
  "knee",
  "ankle",
  "hip",
  "lumbar_spine",
  "thoracic_spine",
  "shoulder",
  "elbow",
  "wrist",
  "neck",
];

const MUSCLE_REGION_MAP = {
  abdominals: ["lumbar_spine"],
  abductors: ["hip"],
  adductors: ["hip"],
  biceps: ["elbow", "shoulder"],
  calves: ["ankle", "knee"],
  chest: ["shoulder"],
  forearms: ["wrist", "elbow"],
  glutes: ["hip"],
  hamstrings: ["hip", "knee"],
  "hip flexors": ["hip", "lumbar_spine"],
  lats: ["shoulder"],
  "lower back": ["lumbar_spine"],
  "middle back": ["thoracic_spine", "shoulder"],
  neck: ["neck"],
  quadriceps: ["knee", "hip"],
  shoulders: ["shoulder"],
  traps: ["neck", "shoulder"],
  triceps: ["elbow", "shoulder"],
};

const PLYOMETRIC_REGIONS = ["knee", "ankle"];

function deriveLoadedRegions(exercise) {
  const regions = [];
  for (const muscle of [
    ...exercise.primaryMuscles,
    ...exercise.secondaryMuscles,
  ]) {
    for (const region of MUSCLE_REGION_MAP[muscle] ?? []) regions.push(region);
  }
  if (exercise.modality === "plyometrics") regions.push(...PLYOMETRIC_REGIONS);
  return [...new Set(regions)].sort(
    (a, b) => REGIONS.indexOf(a) - REGIONS.indexOf(b),
  );
}

async function readCollection(dirName) {
  const dir = path.join(root, dirName);
  if (!existsSync(dir)) return [];
  const names = (await readdir(dir)).filter((n) => n.endsWith(".json")).sort();
  const entries = [];
  for (const name of names) {
    entries.push(JSON.parse(await readFile(path.join(dir, name), "utf8")));
  }
  return entries.sort((a, b) => a.id.localeCompare(b.id));
}

const exercises = (await readCollection("exercises")).map((exercise) => ({
  ...exercise,
  loadedRegions: deriveLoadedRegions(exercise),
}));
const families = await readCollection("families");

const dist = path.join(root, "dist");
await mkdir(dist, { recursive: true });
await writeFile(
  path.join(dist, "exercises.json"),
  `${JSON.stringify(exercises, null, 2)}\n`,
);
await writeFile(
  path.join(dist, "families.json"),
  `${JSON.stringify(families, null, 2)}\n`,
);

console.log(
  `Wrote ${exercises.length} exercise(s) to dist/exercises.json and ${families.length} family(ies) to dist/families.json.`,
);
