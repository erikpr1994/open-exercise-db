import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { Ajv2020 } from "ajv/dist/2020.js";
import { loadVocab, root } from "./new-exercise-form.mjs";

const ajv = new Ajv2020({ allErrors: true });
const validate = ajv.compile(
  JSON.parse(
    await readFile(path.join(root, "schema", "equipment.schema.json"), "utf8"),
  ),
);

test("accepts an entry with a loading category", () => {
  assert.ok(validate([{ name: "barbell", loading: "plates-per-side" }]));
});

test("accepts an entry with a null loading", () => {
  assert.ok(validate([{ name: "keg", loading: null }]));
});

test("rejects an unknown loading value", () => {
  assert.ok(!validate([{ name: "barbell", loading: "per-side" }]));
});

test("rejects an entry without a loading", () => {
  assert.ok(!validate([{ name: "barbell" }]));
});

test("rejects an entry with an unknown property", () => {
  assert.ok(
    !validate([{ name: "barbell", loading: "plates-per-side", weight: 20 }]),
  );
});

test("rejects a bare string entry", () => {
  assert.ok(!validate(["barbell"]));
});

test("the committed equipment vocabulary matches the schema", async () => {
  const data = JSON.parse(
    await readFile(path.join(root, "vocab", "equipment.json"), "utf8"),
  );
  assert.ok(validate(data), JSON.stringify(validate.errors, null, 2));
});

test("loadVocab returns the entry names of the equipment vocabulary", async () => {
  const values = await loadVocab("equipment");
  assert.ok(values.includes("barbell"));
  assert.ok(values.every((value) => typeof value === "string"));
});

test("loadVocab returns a flat vocabulary unchanged", async () => {
  assert.deepEqual(await loadVocab("levels"), [
    "beginner",
    "intermediate",
    "expert",
  ]);
});
