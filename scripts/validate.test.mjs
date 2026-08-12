import assert from "node:assert/strict";
import test from "node:test";
import { checkAliasCollisions } from "./validate.mjs";

function entry(file, name, aliases) {
  return { file, data: { name, aliases } };
}

function collect(entries) {
  const errors = [];
  checkAliasCollisions(entries, (file, message) => errors.push({ file, message }));
  return errors;
}

test("accepts aliases that do not collide with any name", () => {
  const errors = collect([
    entry("exercises/a.json", "Barbell Squat", ["back squat"]),
    entry("exercises/b.json", "Front Squat", ["barbell front squat"]),
  ]);
  assert.deepEqual(errors, []);
});

test("rejects an alias that repeats another exercise's canonical name", () => {
  const errors = collect([
    entry("exercises/a.json", "Barbell Full Squat", ["barbell squat"]),
    entry("exercises/b.json", "Barbell Squat", []),
  ]);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].file, "exercises/a.json");
});

test("rejects an alias that repeats another name after punctuation is ignored", () => {
  const errors = collect([
    entry("exercises/a.json", "Push-Ups With Feet Elevated", ["decline push up"]),
    entry("exercises/b.json", "Decline Push-Up", []),
  ]);
  assert.equal(errors.length, 1);
  assert.equal(errors[0].file, "exercises/a.json");
});

test("rejects an alias that repeats the exercise's own name", () => {
  const errors = collect([entry("exercises/a.json", "Sit-Up", ["sit up"])]);
  assert.equal(errors.length, 1);
  assert.match(errors[0].message, /own name/);
});

test("does not flag an entry against itself when it has no aliases", () => {
  const errors = collect([entry("exercises/a.json", "Deadlift", undefined)]);
  assert.deepEqual(errors, []);
});
