import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import path from "node:path";
import test from "node:test";
import { parseIssueBody, slugify } from "./issue-to-exercise.mjs";
import { root } from "./new-exercise-form.mjs";

const fixture = JSON.parse(
  await readFile(
    path.join(root, "scripts", "fixtures", "new-exercise-issue.json"),
    "utf8",
  ),
);

test("parses a full issue form body into an exercise", () => {
  const exercise = parseIssueBody(fixture.issue.body);
  assert.deepEqual(exercise, {
    id: "bulgarian-split-squat",
    name: "Bulgarian Split Squat",
    aliases: ["Rear-Foot-Elevated Split Squat", "RFE Split Squat"],
    family: "squat",
    variantGroup: "Dumbbell",
    modality: "strength",
    level: "intermediate",
    mechanic: "compound",
    force: null,
    equipment: "dumbbell",
    primaryMuscles: ["quadriceps", "glutes"],
    secondaryMuscles: ["hamstrings"],
    measurementType: "weight_reps",
    laterality: "unilateral",
    instructions: [
      "Stand two feet in front of a bench, facing away from it.",
      "Place the top of your rear foot on the bench.",
      "Lower your hips until the front thigh is parallel to the floor.",
      "Drive through the front heel to stand back up.",
    ],
    images: [],
    video: null,
  });
});

test("keeps the seeded key order", () => {
  const exercise = parseIssueBody(fixture.issue.body);
  assert.deepEqual(Object.keys(exercise), [
    "id",
    "name",
    "aliases",
    "family",
    "variantGroup",
    "modality",
    "level",
    "mechanic",
    "force",
    "equipment",
    "primaryMuscles",
    "secondaryMuscles",
    "measurementType",
    "laterality",
    "instructions",
    "images",
    "video",
  ]);
});

test("maps empty optional answers to null and omits empty aliases", () => {
  const body = [
    "### Name",
    "",
    "Standing Calf Raise",
    "",
    "### Modality",
    "",
    "strength",
    "",
    "### Level",
    "",
    "beginner",
    "",
    "### Equipment",
    "",
    "machine",
    "",
    "### Measurement type",
    "",
    "none",
    "",
    "### Instructions",
    "",
    "Stand on the platform with your toes on the edge.",
    "Raise your heels as high as possible, then lower them.",
  ].join("\n");
  const exercise = parseIssueBody(body);
  assert.equal(exercise.family, null);
  assert.equal(exercise.variantGroup, null);
  assert.equal(exercise.mechanic, null);
  assert.equal(exercise.force, null);
  assert.equal(exercise.measurementType, null);
  assert.equal(exercise.laterality, null);
  assert.equal(exercise.video, null);
  assert.deepEqual(exercise.primaryMuscles, []);
  assert.deepEqual(exercise.secondaryMuscles, []);
  assert.ok(!("aliases" in exercise));
});

test("rejects a body without the required name", () => {
  assert.throws(
    () => parseIssueBody("### Instructions\n\nDo the movement."),
    /required field "Name" is empty/,
  );
});

test("slugify matches the id pattern of the schema", () => {
  assert.equal(slugify("3/4 Sit-Up"), "3-4-sit-up");
  assert.equal(slugify("Farmer's Walk"), "farmer-s-walk");
  assert.equal(slugify("  Piqué Walk  "), "pique-walk");
  assert.throws(() => slugify("!!!"), /cannot build a slug/);
});
