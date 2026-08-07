import { existsSync } from "node:fs";
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Ajv2020 } from "ajv/dist/2020.js";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const errors = [];

function report(file, message) {
  errors.push({ file, message });
}

async function loadVocabs() {
  const vocabs = new Map();
  const dir = path.join(root, "vocab");
  for (const name of (await readdir(dir)).filter((n) => n.endsWith(".json"))) {
    const file = `vocab/${name}`;
    let data;
    try {
      data = JSON.parse(await readFile(path.join(dir, name), "utf8"));
    } catch (cause) {
      report(file, `invalid JSON: ${cause.message}`);
      continue;
    }
    if (!Array.isArray(data) || !data.every((v) => typeof v === "string")) {
      report(file, "must be a flat array of strings");
      continue;
    }
    if (new Set(data).size !== data.length) {
      report(file, "contains duplicate values");
    }
    vocabs.set(name.replace(/\.json$/, ""), new Set(data));
  }
  return vocabs;
}

function createAjv(vocabs) {
  const ajv = new Ajv2020({ allErrors: true });
  ajv.addKeyword({
    keyword: "x-vocab",
    schemaType: "string",
    errors: true,
    validate: function checkVocab(vocabName, value) {
      const members = vocabs.get(vocabName);
      if (members === undefined) {
        checkVocab.errors = [
          {
            keyword: "x-vocab",
            message: `schema refers to unknown vocabulary "${vocabName}"`,
            params: { vocab: vocabName },
          },
        ];
        return false;
      }
      if (members.has(value)) return true;
      checkVocab.errors = [
        {
          keyword: "x-vocab",
          message: `value ${JSON.stringify(value)} is not in vocab/${vocabName}.json`,
          params: { vocab: vocabName },
        },
      ];
      return false;
    },
  });
  return ajv;
}

async function compileValidator(ajv, schemaFile) {
  const schema = JSON.parse(
    await readFile(path.join(root, "schema", schemaFile), "utf8"),
  );
  return ajv.compile(schema);
}

async function readCollection(dirName) {
  const dir = path.join(root, dirName);
  if (!existsSync(dir)) return [];
  const names = (await readdir(dir)).filter((n) => n.endsWith(".json")).sort();
  const entries = [];
  for (const name of names) {
    const file = `${dirName}/${name}`;
    try {
      entries.push({
        file,
        stem: name.replace(/\.json$/, ""),
        data: JSON.parse(await readFile(path.join(dir, name), "utf8")),
      });
    } catch (cause) {
      report(file, `invalid JSON: ${cause.message}`);
    }
  }
  return entries;
}

function reportSchemaErrors(entry, validate) {
  if (validate(entry.data)) return;
  for (const error of validate.errors ?? []) {
    const where = error.instancePath === "" ? "" : `${error.instancePath} `;
    report(entry.file, `${where}${error.message}`);
  }
}

function checkFileName(entry) {
  if (typeof entry.data.id === "string" && entry.data.id !== entry.stem) {
    report(
      entry.file,
      `file name does not match id "${entry.data.id}"; the file must be named ${entry.data.id}.json`,
    );
  }
}

function checkUniqueIds(entries) {
  const seen = new Map();
  for (const entry of entries) {
    const { id } = entry.data;
    if (typeof id !== "string") continue;
    if (seen.has(id)) {
      report(entry.file, `duplicate id "${id}", already used by ${seen.get(id)}`);
    } else {
      seen.set(id, entry.file);
    }
  }
}

function checkFamilyReference(entry) {
  const { family } = entry.data;
  if (typeof family !== "string") return;
  if (!existsSync(path.join(root, "families", `${family}.json`))) {
    report(
      entry.file,
      `family "${family}" does not resolve to families/${family}.json`,
    );
  }
}

function checkMuscleOverlap(entry) {
  const { primaryMuscles, secondaryMuscles } = entry.data;
  if (!Array.isArray(primaryMuscles) || !Array.isArray(secondaryMuscles)) return;
  const primary = new Set(primaryMuscles);
  for (const muscle of secondaryMuscles) {
    if (primary.has(muscle)) {
      report(
        entry.file,
        `muscle "${muscle}" appears in both primaryMuscles and secondaryMuscles`,
      );
    }
  }
}

function checkImages(entry) {
  const { id, images } = entry.data;
  if (typeof id !== "string" || !Array.isArray(images)) return;
  for (const image of images) {
    if (typeof image !== "string") continue;
    if (!image.startsWith(`${id}/`)) {
      report(entry.file, `image path "${image}" must start with "${id}/"`);
    }
    if (!existsSync(path.join(root, "images", image))) {
      report(entry.file, `image file images/${image} does not exist`);
    }
  }
}

function checkAliases(entry) {
  const { aliases } = entry.data;
  if (aliases === undefined) return;
  if (!Array.isArray(aliases) || !aliases.every((a) => typeof a === "string")) {
    report(entry.file, "aliases must be a flat array of strings");
  }
}

const vocabs = await loadVocabs();
const ajv = createAjv(vocabs);
const validateExercise = await compileValidator(ajv, "exercise.schema.json");
const validateFamily = await compileValidator(ajv, "family.schema.json");

const exercises = await readCollection("exercises");
const families = await readCollection("families");

for (const entry of families) {
  reportSchemaErrors(entry, validateFamily);
  checkFileName(entry);
}

for (const entry of exercises) {
  reportSchemaErrors(entry, validateExercise);
  checkFileName(entry);
  checkFamilyReference(entry);
  checkMuscleOverlap(entry);
  checkImages(entry);
  checkAliases(entry);
}

checkUniqueIds(exercises);
checkUniqueIds(families);

console.log(
  `Validated ${exercises.length} exercise file(s) and ${families.length} family file(s).`,
);

if (errors.length > 0) {
  const byFile = new Map();
  for (const { file, message } of errors) {
    if (!byFile.has(file)) byFile.set(file, []);
    byFile.get(file).push(message);
  }
  console.error(`\n${errors.length} error(s) in ${byFile.size} file(s):`);
  for (const [file, messages] of byFile) {
    console.error(`\n${file}`);
    for (const message of messages) console.error(`  - ${message}`);
  }
  process.exit(1);
}

console.log("All files are valid.");
