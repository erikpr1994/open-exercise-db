import assert from "node:assert/strict";
import test from "node:test";
import { computeDataChanges, formatDataChanges } from "./release-notes.mjs";

const squat = { id: "squat", name: "Squat", equipment: "barbell" };
const lunge = { id: "lunge", name: "Lunge", equipment: "body only" };

test("finds an id present now but not in the released set as added", () => {
  const { added, removed, modified } = computeDataChanges([squat, lunge], [squat]);
  assert.deepEqual(added, [lunge]);
  assert.deepEqual(removed, []);
  assert.deepEqual(modified, []);
});

test("finds an id present in the released set but not now as removed", () => {
  const { added, removed, modified } = computeDataChanges([squat], [squat, lunge]);
  assert.deepEqual(added, []);
  assert.deepEqual(removed, [lunge]);
  assert.deepEqual(modified, []);
});

test("finds a changed field as modified, naming only the changed field", () => {
  const before = { id: "squat", name: "Squat", equipment: "barbell" };
  const after = { id: "squat", name: "Squat", equipment: "smith machine" };
  const { modified } = computeDataChanges([after], [before]);
  assert.deepEqual(modified, [{ id: "squat", fields: ["equipment"] }]);
});

test("treats an unchanged exercise as neither added, removed, nor modified", () => {
  const { added, removed, modified } = computeDataChanges([squat], [squat]);
  assert.deepEqual(added, []);
  assert.deepEqual(removed, []);
  assert.deepEqual(modified, []);
});

test("formats a removed id with its tombstone reason", () => {
  const tombstones = new Map([["lunge", "out of scope: goal, not a movement"]]);
  const markdown = formatDataChanges([squat], [], [lunge], [], tombstones);
  assert.match(markdown, /`lunge` — out of scope: goal, not a movement/);
});

test("formats a removed id with no tombstone reason recorded", () => {
  const markdown = formatDataChanges([squat], [], [lunge], [], new Map());
  assert.match(markdown, /`lunge` — no tombstone reason recorded/);
});

test("omits a section for a category with no entries", () => {
  const markdown = formatDataChanges([squat], [], [], [], new Map());
  assert.doesNotMatch(markdown, /### Added/);
  assert.doesNotMatch(markdown, /### Removed/);
  assert.doesNotMatch(markdown, /### Modified/);
});
