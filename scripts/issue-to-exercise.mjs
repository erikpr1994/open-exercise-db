import { existsSync } from "node:fs";
import { appendFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { NONE, fields, root } from "./new-exercise-form.mjs";

const NO_RESPONSE = "_No response_";

export function slugify(name) {
  const slug = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (slug === "") {
    throw new Error(`cannot build a slug from the name ${JSON.stringify(name)}`);
  }
  return slug;
}

function splitSections(body) {
  const sections = new Map();
  let label;
  let lines = [];
  const store = () => {
    if (label !== undefined) sections.set(label, lines.join("\n").trim());
  };
  for (const line of body.split(/\r?\n/)) {
    const heading = line.match(/^### (.+?)\s*$/);
    if (heading) {
      store();
      label = heading[1];
      lines = [];
    } else {
      lines.push(line);
    }
  }
  store();
  return sections;
}

function textValue(sections, field) {
  const raw = sections.get(field.label) ?? "";
  const value = raw === NO_RESPONSE ? "" : raw.trim();
  if (value === "" && field.required) {
    throw new Error(`the required field "${field.label}" is empty`);
  }
  return value;
}

function optionValue(sections, field) {
  const value = textValue(sections, field);
  return value === "" || value === NONE ? null : value;
}

function checkedValues(sections, field) {
  const raw = sections.get(field.label) ?? "";
  const values = [];
  for (const line of raw.split("\n")) {
    const checked = line.match(/^- \[[xX]\] (.+?)\s*$/);
    if (checked) values.push(checked[1]);
  }
  return values;
}

function listValue(sections, field) {
  return [
    ...new Set(
      textValue(sections, field)
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part !== ""),
    ),
  ];
}

function linesValue(sections, field) {
  return textValue(sections, field)
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
}

export function parseIssueBody(body) {
  const sections = splitSections(body);
  const byProperty = new Map(fields.map((f) => [f.property, f]));
  const text = (p) => textValue(sections, byProperty.get(p));
  const option = (p) => optionValue(sections, byProperty.get(p));
  const checked = (p) => checkedValues(sections, byProperty.get(p));

  const name = text("name");
  const aliases = listValue(sections, byProperty.get("aliases"));
  const family = option("family");
  const exercise = {
    id: slugify(name),
    name,
    ...(aliases.length > 0 ? { aliases } : {}),
    family: family === null ? null : slugify(family),
    variantGroup: option("variantGroup"),
    modality: text("modality"),
    level: text("level"),
    mechanic: option("mechanic"),
    force: option("force"),
    equipment: text("equipment"),
    primaryMuscles: checked("primaryMuscles"),
    secondaryMuscles: checked("secondaryMuscles"),
    measurementType: option("measurementType"),
    laterality: option("laterality"),
    instructions: linesValue(sections, byProperty.get("instructions")),
    images: [],
    video: option("video"),
  };
  return exercise;
}

async function main(eventPath) {
  const event = JSON.parse(await readFile(eventPath, "utf8"));
  const exercise = parseIssueBody(event.issue.body ?? "");
  const file = path.join(root, "exercises", `${exercise.id}.json`);
  if (existsSync(file)) {
    throw new Error(
      `exercises/${exercise.id}.json already exists; pick a more specific name`,
    );
  }
  await writeFile(file, `${JSON.stringify(exercise, null, 2)}\n`);
  const outputs = `id=${exercise.id}\nname=${exercise.name}\n`;
  if (process.env.GITHUB_OUTPUT) {
    await appendFile(process.env.GITHUB_OUTPUT, outputs);
  }
  console.log(`Wrote exercises/${exercise.id}.json`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const eventPath = process.argv[2] ?? process.env.GITHUB_EVENT_PATH;
  if (!eventPath) {
    console.error("usage: node scripts/issue-to-exercise.mjs <event.json>");
    process.exit(1);
  }
  try {
    await main(eventPath);
  } catch (cause) {
    console.error(cause.message);
    process.exit(1);
  }
}
