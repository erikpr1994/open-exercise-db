import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

export const NONE = "none";

export const fields = [
  {
    property: "name",
    label: "Name",
    type: "input",
    required: true,
    description:
      "The canonical English name. It must describe a concrete action, not a goal or a body region.",
    placeholder: "Barbell Back Squat",
  },
  {
    property: "family",
    label: "Family",
    type: "input",
    description:
      'The slug of an existing family. A slug is the lowercase hyphenated file name in families/, for example "squat" for families/squat.json. Leave this empty when the exercise has no family.',
    placeholder: "squat",
  },
  {
    property: "modality",
    label: "Modality",
    type: "dropdown",
    required: true,
  },
  {
    property: "level",
    label: "Level",
    type: "dropdown",
    required: true,
  },
  {
    property: "equipment",
    label: "Equipment",
    type: "dropdown",
    required: true,
  },
  {
    property: "measurementType",
    label: "Measurement type",
    type: "dropdown",
    description:
      'How one set of this exercise is measured. Select "none" if you are not sure.',
  },
  {
    property: "laterality",
    label: "Laterality",
    type: "dropdown",
    description:
      'Select "bilateral" when the movement loads both sides at the same time, "unilateral" when it loads one side at a time, or "none" if you are not sure.',
  },
  {
    property: "mechanic",
    label: "Mechanic",
    type: "dropdown",
  },
  {
    property: "force",
    label: "Force",
    type: "dropdown",
  },
  {
    property: "primaryMuscles",
    label: "Primary muscles",
    type: "checkboxes",
    description: "The muscles that do the main work.",
  },
  {
    property: "secondaryMuscles",
    label: "Secondary muscles",
    type: "checkboxes",
    description: "The muscles that assist. Do not repeat a primary muscle.",
  },
  {
    property: "instructions",
    label: "Instructions",
    type: "textarea",
    required: true,
    description: "The ordered execution steps, in English. Write one step per line.",
    placeholder: "Stand with the bar on your upper back.\nSquat down until your thighs are parallel to the floor.\nDrive back up to the start position.",
  },
  {
    property: "aliases",
    label: "Aliases",
    type: "input",
    description:
      "Alternative English names for the same movement, separated by commas.",
    placeholder: "Back Squat, Olympic Squat",
  },
  {
    property: "video",
    label: "Video URL",
    type: "input",
    description: "A YouTube video that shows the movement.",
    placeholder: "https://www.youtube.com/watch?v=XXXXXXXXXXX",
  },
  {
    property: "variantGroup",
    label: "Variant group",
    type: "input",
    description:
      'A free-text sub-group inside a large family, for example "Incline" or "Kettlebell".',
    placeholder: "Kettlebell",
  },
];

export async function loadExerciseSchema() {
  return JSON.parse(
    await readFile(path.join(root, "schema", "exercise.schema.json"), "utf8"),
  );
}

export function vocabNameFor(schema, property) {
  const found = findVocabKeyword(schema.properties[property]);
  if (found === undefined) {
    throw new Error(`schema property "${property}" has no x-vocab keyword`);
  }
  return found;
}

function findVocabKeyword(node) {
  if (node === null || typeof node !== "object") return undefined;
  if (typeof node["x-vocab"] === "string") return node["x-vocab"];
  for (const value of Object.values(node)) {
    const found = Array.isArray(value)
      ? value.map(findVocabKeyword).find((v) => v !== undefined)
      : findVocabKeyword(value);
    if (found !== undefined) return found;
  }
  return undefined;
}

export async function loadVocab(name) {
  const entries = JSON.parse(
    await readFile(path.join(root, "vocab", `${name}.json`), "utf8"),
  );
  return entries.map((entry) =>
    typeof entry === "string" ? entry : entry.name,
  );
}
