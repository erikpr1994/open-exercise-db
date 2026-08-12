import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { stringify } from "yaml";
import {
  NONE,
  fields,
  loadExerciseSchema,
  loadVocab,
  root,
  vocabNameFor,
} from "./new-exercise-form.mjs";

const intro = [
  "Propose a new exercise without cloning the repository.",
  "A maintainer reviews the answers and writes the exercise file in a pull request.",
  "Read [CONTRIBUTING.md](https://github.com/erikpr1994/open-exercise-db/blob/main/CONTRIBUTING.md) first.",
  "All content is English-only: the name, the aliases, and the instructions.",
].join("\n");

function fieldId(property) {
  return property.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

async function vocabValues(schema, field) {
  return loadVocab(vocabNameFor(schema, field.property));
}

async function buildBodyElement(schema, field) {
  const attributes = { label: field.label };
  if (field.description !== undefined) {
    attributes.description = field.description;
  }
  if (field.placeholder !== undefined) {
    attributes.placeholder = field.placeholder;
  }
  const element = {
    type: field.type,
    id: fieldId(field.property),
    attributes,
  };
  if (field.type === "dropdown") {
    const values = await vocabValues(schema, field);
    attributes.options = field.required ? values : [NONE, ...values];
    if (!field.required) attributes.default = 0;
  }
  if (field.type === "checkboxes") {
    attributes.options = (await vocabValues(schema, field)).map((value) => ({
      label: value,
    }));
  }
  if (field.required) {
    element.validations = { required: true };
  }
  return element;
}

const schema = await loadExerciseSchema();

const form = {
  name: "New exercise",
  description: "Propose a new exercise for the catalogue.",
  title: "New exercise: ",
  labels: ["new-exercise"],
  body: [
    { type: "markdown", attributes: { value: intro } },
    ...(await Promise.all(fields.map((f) => buildBodyElement(schema, f)))),
  ],
};

const dir = path.join(root, ".github", "ISSUE_TEMPLATE");
await mkdir(dir, { recursive: true });
const file = path.join(dir, "new-exercise.yml");
await writeFile(file, stringify(form, { lineWidth: 0 }));
console.log(`Wrote ${path.relative(root, file)}`);
