import assert from "node:assert/strict";
import test from "node:test";
import { compareReleases } from "./check-release-compat.mjs";

function run({ released, current, removed = [], corrections = [] }) {
  return compareReleases(
    released,
    new Map(current.map((exercise) => [exercise.id, exercise])),
    new Map(removed.map((entry) => [entry.id, entry])),
    corrections,
  );
}

const squat = {
  id: "squat",
  measurementType: "weight_reps",
  laterality: "bilateral",
  directionality: null,
};

test("accepts an unchanged catalogue", () => {
  const { violations, tombstoned, corrected } = run({
    released: [squat],
    current: [squat],
  });
  assert.deepEqual(violations, []);
  assert.equal(tombstoned, 0);
  assert.equal(corrected, 0);
});

test("rejects a released id that disappears without a tombstone", () => {
  const { violations } = run({ released: [squat], current: [] });
  assert.equal(violations.length, 1);
  assert.match(violations[0], /tombstoned/);
});

test("counts a tombstoned removal as deliberate", () => {
  const { violations, tombstoned } = run({
    released: [squat],
    current: [],
    removed: [{ id: "squat" }],
  });
  assert.deepEqual(violations, []);
  assert.equal(tombstoned, 1);
});

test("rejects a tombstone whose file still exists", () => {
  const { violations } = run({
    released: [squat],
    current: [squat],
    removed: [{ id: "squat" }],
  });
  assert.equal(violations.length, 1);
  assert.match(violations[0], /still exists/);
});

test("rejects a measurementType change", () => {
  const { violations } = run({
    released: [squat],
    current: [{ ...squat, measurementType: "reps" }],
  });
  assert.equal(violations.length, 1);
  assert.match(violations[0], /measurementType/);
});

test("rejects a laterality change without a correction entry", () => {
  const { violations } = run({
    released: [squat],
    current: [{ ...squat, laterality: "unilateral" }],
  });
  assert.equal(violations.length, 1);
  assert.match(violations[0], /laterality/);
  assert.match(violations[0], /corrected-exercises\.json/);
});

test("accepts a laterality change that a correction entry sanctions", () => {
  const { violations, corrected } = run({
    released: [squat],
    current: [{ ...squat, laterality: "unilateral" }],
    corrections: [
      { id: "squat", field: "laterality", from: "bilateral", to: "unilateral" },
    ],
  });
  assert.deepEqual(violations, []);
  assert.equal(corrected, 1);
});

test("rejects a change whose correction entry names other values", () => {
  const { violations } = run({
    released: [squat],
    current: [{ ...squat, laterality: "unilateral" }],
    corrections: [
      { id: "squat", field: "laterality", from: "unilateral", to: "bilateral" },
    ],
  });
  assert.equal(violations.length, 1);
});

test("rejects a directionality change without a correction entry", () => {
  const { violations } = run({
    released: [{ ...squat, directionality: "bidirectional" }],
    current: [{ ...squat, directionality: "unidirectional" }],
  });
  assert.equal(violations.length, 1);
  assert.match(violations[0], /directionality/);
});

test("accepts setting a field the release holds as null or absent", () => {
  const { violations } = run({
    released: [{ id: "squat", measurementType: null, laterality: "bilateral" }],
    current: [
      {
        ...squat,
        measurementType: "weight_reps",
        directionality: "bidirectional",
      },
    ],
  });
  assert.deepEqual(violations, []);
});
