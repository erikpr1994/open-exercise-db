// One-time import of the exercise catalogue.
// Provenance: free-exercise-db at pinned commit
// b0eed061e1c832b3ed815fbaa4b45b3cdc14df49 (the vendored dump in the Peak
// Health v2 repo), re-curated with the v2 taxonomy modules
// (packages/domain/src/{catalog-taxonomy,family-rehome,exercise-aliases,
// equipment-derivation}.ts). The six narrow squat families from v2 are folded
// back into one broad "squat" family; the split labels become variantGroup
// values. Requires Node >= 23 (native TypeScript type stripping).
//
// Usage: node scripts/import/generate-catalog.mjs <path-to-peakhealthv2-repo>

import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  createFamilyAssigner,
  SQUAT_SPLIT_VARIANT,
} from "./family-assignment.mjs";
import { deriveMeasurementType } from "./measurement.mjs";
import { slugify } from "./slug.mjs";

const root = path.dirname(
  path.dirname(path.dirname(fileURLToPath(import.meta.url))),
);

const v2Root = process.argv[2];
if (!v2Root) {
  console.error(
    "Usage: node scripts/import/generate-catalog.mjs <path-to-peakhealthv2-repo>",
  );
  process.exit(1);
}

function v2Module(relative) {
  return import(pathToFileURL(path.resolve(v2Root, relative)).href);
}

const taxonomy = await v2Module("packages/domain/src/catalog-taxonomy.ts");
const rehome = await v2Module("packages/domain/src/family-rehome.ts");
const aliases = await v2Module("packages/domain/src/exercise-aliases.ts");
const equipment = await v2Module("packages/domain/src/equipment-derivation.ts");

const sourceRecords = JSON.parse(
  await readFile(
    path.resolve(v2Root, "supabase/scripts/data/free-exercise-db.exercises.json"),
    "utf8",
  ),
);

const UPSTREAM_EQUIPMENT = [
  "bands",
  "barbell",
  "body only",
  "cable",
  "dumbbell",
  "e-z curl bar",
  "exercise ball",
  "foam roll",
  "kettlebells",
  "machine",
  "medicine ball",
  "other",
];

const equipmentVocab = [
  ...UPSTREAM_EQUIPMENT,
  ...equipment.NEW_EQUIPMENT_NAMES,
].sort();

const DROPPED_FAMILIES = new Set(["Stretch", "Other"]);

const SQUAT_DESCRIPTION =
  "Every squat variant — back-loaded barbell, front, goblet, box and bench, " +
  "overhead, split and single-leg, and machine-supported — in one broad " +
  "movement family. variantGroup carries the finer split.";

const familyDescriptions = new Map([
  ...taxonomy.TAXONOMY_NEW_FAMILIES.map((f) => [f.name, f.description]),
  ...rehome.NEW_FAMILIES.map((f) => [f.name, f.description]),
  ["Squat", SQUAT_DESCRIPTION],
]);

const families = [
  ...taxonomy.TAXONOMY_FAMILY_CATEGORIES.filter(
    ({ family }) => !DROPPED_FAMILIES.has(family),
  ).map(({ family, category }) => ({ name: family, category })),
  ...taxonomy.TAXONOMY_NEW_FAMILIES.filter(
    (f) => !(f.name in SQUAT_SPLIT_VARIANT),
  ).map(({ name, category }) => ({ name, category })),
].map(({ name, category }) => {
  const description = familyDescriptions.get(name);
  return {
    id: slugify(name),
    name,
    category,
    ...(description === undefined ? {} : { description }),
  };
});

const familyIds = new Set(families.map((f) => f.id));
if (familyIds.size !== families.length) {
  throw new Error("Duplicate family ids after slugification");
}

const aliasByName = new Map(
  aliases.EXERCISE_ALIASES.map(({ name, en }) => [name, [...new Set(en)]]),
);
let aliasCoverage = 0;

function lookupAliases(name) {
  const found = aliasByName.get(name);
  if (found === undefined || found.length === 0) return undefined;
  aliasCoverage += 1;
  return found;
}

function normalizeVideo(url) {
  if (typeof url !== "string") return null;
  let id = null;
  try {
    const parsed = new URL(url);
    if (/(^|\.)youtube\.com$/.test(parsed.hostname)) {
      id = parsed.searchParams.get("v");
    } else if (parsed.hostname === "youtu.be") {
      id = parsed.pathname.slice(1);
    }
  } catch {
    return null;
  }
  if (id === null || !/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
  return `https://www.youtube.com/watch?v=${id}`;
}

const UNILATERAL_PATTERN =
  /(single|one[ -]?arm|one[ -]?leg|one[ -]?hand|split|pistol|bulgarian|alternat)/i;

function deriveLaterality(name) {
  return UNILATERAL_PATTERN.test(name) ? "unilateral" : "bilateral";
}

const assignFamily = createFamilyAssigner({
  taxonomyRehome: taxonomy.TAXONOMY_REHOME,
  familyRehome: rehome.FAMILY_REHOME,
  variantGroups: taxonomy.TAXONOMY_VARIANT_GROUPS,
});

function dedupeMuscles(primary, secondary) {
  const primarySet = [...new Set(primary)];
  return {
    primaryMuscles: primarySet,
    secondaryMuscles: [...new Set(secondary)].filter(
      (muscle) => !primarySet.includes(muscle),
    ),
  };
}

function importedExercise(record) {
  const id = slugify(record.name);
  const resolvedEquipment =
    record.equipment === null || record.equipment === "other"
      ? equipment.deriveEquipmentName(record.name)
      : record.equipment;
  const { primaryMuscles, secondaryMuscles } = dedupeMuscles(
    record.primaryMuscles,
    record.secondaryMuscles,
  );
  const { family, variantGroup } = assignFamily({
    name: record.name,
    modality: record.category,
    equipment: resolvedEquipment,
    primaryMuscles,
  });
  const foundAliases = lookupAliases(record.name);
  return {
    id,
    name: record.name,
    ...(foundAliases === undefined ? {} : { aliases: foundAliases }),
    family,
    variantGroup,
    modality: record.category,
    level: record.level,
    mechanic: record.mechanic,
    force: record.force,
    equipment: resolvedEquipment,
    primaryMuscles,
    secondaryMuscles,
    measurementType: deriveMeasurementType({
      name: record.name,
      modality: record.category,
      equipment: resolvedEquipment,
      force: record.force,
    }),
    laterality: deriveLaterality(record.name),
    instructions: record.instructions.filter((step) => step.trim() !== ""),
    images: record.images.map((image) => `${id}/${path.basename(image)}`),
    video: normalizeVideo(record.videoUrl),
    source: { name: "free-exercise-db", id: record.id },
  };
}

function authoredExercise(record) {
  const id = slugify(record.name);
  const foundAliases = lookupAliases(record.name);
  return {
    id,
    name: record.name,
    ...(foundAliases === undefined ? {} : { aliases: foundAliases }),
    family: slugify(record.family),
    variantGroup: null,
    modality: record.modality,
    level: record.level,
    mechanic: record.mechanic,
    force: record.force,
    equipment: record.equipment,
    primaryMuscles: record.primaryMuscles,
    secondaryMuscles: record.secondaryMuscles,
    measurementType: record.measurementType,
    laterality: record.laterality,
    instructions: record.instructions.split(/(?<=[.!?])\s+/),
    images: [],
    video: null,
  };
}

const exercises = [
  ...sourceRecords.map(importedExercise),
  ...taxonomy.TAXONOMY_NEW_EXERCISES.map(authoredExercise),
];

const exerciseIds = new Set(exercises.map((e) => e.id));
if (exerciseIds.size !== exercises.length) {
  throw new Error("Duplicate exercise ids after slugification");
}
for (const exercise of exercises) {
  if (exercise.family !== null && !familyIds.has(exercise.family)) {
    throw new Error(
      `Exercise "${exercise.name}" points at unknown family "${exercise.family}"`,
    );
  }
  if (!equipmentVocab.includes(exercise.equipment)) {
    throw new Error(
      `Exercise "${exercise.name}" uses unknown equipment "${exercise.equipment}"`,
    );
  }
}

async function writeCollection(dirName, entries) {
  const dir = path.join(root, dirName);
  await rm(dir, { recursive: true, force: true });
  await mkdir(dir, { recursive: true });
  for (const entry of entries) {
    await writeFile(
      path.join(dir, `${entry.id}.json`),
      `${JSON.stringify(entry, null, 2)}\n`,
    );
  }
}

await writeFile(
  path.join(root, "vocab", "equipment.json"),
  `${JSON.stringify(equipmentVocab, null, 2)}\n`,
);
await writeCollection("families", families);
await writeCollection("exercises", exercises);

const nullCount = (field) =>
  exercises.filter((e) => e[field] === null).length;
console.log(
  `Wrote ${exercises.length} exercises, ${families.length} families, ` +
    `${equipmentVocab.length} equipment values.`,
);
console.log(
  `null family: ${nullCount("family")}, ` +
    `null measurementType: ${nullCount("measurementType")}, ` +
    `null laterality: ${nullCount("laterality")}, ` +
    `alias coverage: ${aliasCoverage}.`,
);

if (process.argv.includes("--report")) {
  for (const e of exercises) {
    console.log(
      [e.id, e.family, e.variantGroup, e.measurementType, e.laterality].join(
        "\t",
      ),
    );
  }
}
