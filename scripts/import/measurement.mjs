const STRENGTH_MODALITIES = new Set([
  "strength",
  "powerlifting",
  "olympic weightlifting",
  "strongman",
]);

const BODYWEIGHT_EQUIPMENT = new Set([
  "body only",
  "exercise ball",
  "foam roll",
  "suspension trainer",
  "ab wheel",
  "bands",
  "jump rope",
  "balance board",
  "agility hurdle",
]);

const LOADED_EQUIPMENT = new Set([
  "barbell",
  "dumbbell",
  "kettlebells",
  "cable",
  "machine",
  "e-z curl bar",
  "medicine ball",
  "trap bar",
  "atlas stone",
  "weight plate",
  "log",
  "keg",
  "sandbag",
  "resistance chains",
  "sledgehammer",
  "tire",
  "head harness",
  "wrist roller",
  "sled",
  "farmer's walk handles",
  "yoke",
]);

const LOADED_CARRY_PATTERN =
  /farmer|rickshaw carry|yoke walk|conan|backward walk|sled (push|drag)|backward drag|forward drag|bear crawl|\bcarry\b/i;

const OVERRIDES = new Map([
  ["Circus Bell", "weight_reps"],
  ["Power Stairs", "weight_reps"],
  ["Balance Board", "time"],
]);

export function deriveMeasurementType({ name, modality, equipment, force }) {
  if (OVERRIDES.has(name)) return OVERRIDES.get(name);
  if (modality === "stretching" || modality === "cardio") return "time";
  if (modality === "plyometrics") return "reps";
  if (!STRENGTH_MODALITIES.has(modality)) return null;
  if (/assisted/i.test(name)) return "assisted_weight_reps";
  if (LOADED_CARRY_PATTERN.test(name)) return "weighted_time";
  if (/isometric/i.test(name)) return "time";
  if (force === "static") {
    return BODYWEIGHT_EQUIPMENT.has(equipment) ? "time" : "weighted_time";
  }
  if (equipment === "weight vest") return "weighted_bodyweight_reps";
  if (BODYWEIGHT_EQUIPMENT.has(equipment)) return "reps";
  if (LOADED_EQUIPMENT.has(equipment)) return "weight_reps";
  if (equipment === "battle ropes") return "time";
  return null;
}
