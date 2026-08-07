import { slugify } from "./slug.mjs";

export const SQUAT_SPLIT_VARIANT = {
  "Squat (Barbell)": "Barbell",
  "Front & Goblet Squat": "Front & Goblet",
  "Split & Single-Leg Squat": "Split & Single-Leg",
  "Box & Bench Squat": "Box & Bench",
  "Overhead Squat": "Overhead",
  "Machine Squat": "Machine",
};

const MANUAL_FAMILY = new Map([
  ["Rack Delivery", "clean"],
  ["Cable Incline Pushdown", "straight-arm-pulldown"],
  ["Scapular Pull-Up", "scapular-raise"],
  ["Rocky Pull-Ups/Pulldowns", "pull-up"],
  ["Wind Sprints", "leg-raise"],
  ["Mountain Climbers", "crawl"],
  ["Drop Push", "push-up"],
  ["Isometric Chest Squeezes", null],
  ["Isometric Wipers", null],
  ["Iron Cross", null],
  ["Downward Facing Balance", null],
  ["Balance Board", null],
  ["Crucifix", null],
  ["Bent Press", "windmill"],
  ["Smith Machine Hip Raise", "glute-bridge"],
  ["Standing Pelvic Tilt", "mobility"],
  ["Windmills", "mobility"],
  ["Side Jackknife", "crunch"],
  ["Cocoons", "crunch"],
  ["Otis-Up", "sit-up"],
  ["Butt-Ups", "plank"],
  ["Leg Lift", "glute-kickback"],
  ["Lunge Sprint", "lunge"],
  ["Shoulder Raise", "mobility"],
  ["Landmine 180's", "wood-chop"],
  ["Cable Judo Flip", "wood-chop"],
  ["Medicine Ball Full Twist", "russian-twist"],
  ["Band Pull Apart", "reverse-fly"],
  ["Bent Over Low-Pulley Side Lateral", "reverse-fly"],
  ["Side Laterals to Front Raise", "lateral-raise"],
  ["Alternating Deltoid Raise", "lateral-raise"],
  ["Dumbbell Raise", "lateral-raise"],
  ["Single Dumbbell Raise", "front-raise"],
  ["Around The Worlds", "fly"],
  ["Front Leg Raises", "mobility"],
  ["Rear Leg Raises", "mobility"],
  ["Side Leg Raises", "mobility"],
  ["Groiners", "mobility"],
  ["Inchworm", "mobility"],
  ["Scissor Kick", "leg-raise"],
  ["Frog Hops", "plyometric-jump"],
  ["Push Up to Side Plank", "push-up"],
  ["Stride Jump Crossover", "plyometric-jump"],
]);

const NAME_RULES = [
  [/circles?\b/i, "mobility"],
  [/wrist curl/i, "wrist-curl"],
  [
    /wrist roller|wrist rotation|finger curls|plate pinch|hand squeeze|lying pronation|lying supination/i,
    "forearm-grip",
  ],
  [/face pull/i, "face-pull"],
  [/upright.*\brows?\b/i, "upright-row"],
  [/clean and jerk/i, "clean"],
  [/(clean|snatch) (pull|shrug|deadlift)|high pull/i, "olympic-pull"],
  [/\bjerk\b/i, "jerk"],
  [/snatch/i, "snatch"],
  [/\bcleans?\b/i, "clean"],
  [/get-?up/i, "turkish-get-up"],
  [/windmill/i, "windmill"],
  [/wood chop|cable lift/i, "wood-chop"],
  [/russian twist|barbell twist|plate twist/i, "russian-twist"],
  [/side bend/i, "side-bend"],
  [/side bridge|side plank/i, "side-bridge"],
  [/push.?ups?\b/i, "push-up"],
  [/\bplank\b/i, "plank"],
  [/pallof/i, "anti-rotation-press"],
  [/dead bug|hollow|stomach vacuum/i, "hollow-stability-hold"],
  [/glute.?ham raise/i, "glute-ham-raise"],
  [/reverse hyperextension/i, "hip-extension"],
  [/hyperextension|back extension|superman/i, "back-extension"],
  [/good morning/i, "good-morning"],
  [/pull.?through/i, "pull-through"],
  [
    /romanian|stiff.?leg|one.?legged deadlift|single.?leg deadlift/i,
    "romanian-stiff-leg-deadlift",
  ],
  [/deadlift|rack pull/i, "deadlift"],
  [/kettlebell swings?|vertical swing/i, "kettlebell-swing"],
  [/jump squat/i, "plyometric-jump"],
  [/squat/i, "squat"],
  [/lunge/i, "lunge"],
  [/step.?ups?\b/i, "step-up"],
  [/calf raise|calf press|donkey calf/i, "calf-raise"],
  [/leg press/i, "leg-press"],
  [/leg extension/i, "leg-extension"],
  [/leg curl|hamstring curl|hamstring slides|manual hamstring/i, "leg-curl"],
  [/reverse crunch/i, "reverse-crunch"],
  [/crunch/i, "crunch"],
  [/sit-?ups?\b/i, "sit-up"],
  [/rollout|fallout|ab roller/i, "crunch"],
  [
    /leg raise|leg pull-in|\bpull-in\b|knee raise|hip raise|hanging pike|flutter|scissor kick|jackknife|leg tucks/i,
    "leg-raise",
  ],
  [/bridge\b|butt lift/i, "glute-bridge"],
  [/hip thrust|hip lift/i, "hip-thrust"],
  [/hip extension/i, "hip-extension"],
  [/kickback/i, "glute-kickback"],
  [/abduct|monster walk/i, "hip-abduction"],
  [/adduct/i, "hip-adduction"],
  [/straight-arm pulldown/i, "straight-arm-pulldown"],
  [/pulldowns?\b/i, "lat-pulldown"],
  [/pushdown/i, "triceps-pushdown"],
  [/muscle up|pull[ -]?ups?\b|pullups?\b|chins?\b|chin-?up/i, "pull-up"],
  [/\brows?\b/i, "row"],
  [/shrug/i, "shrug"],
  [/pullover/i, "pullover"],
  [/floor press/i, "floor-press"],
  [/bench press|chest press|board press|pin presses|chain press/i, "bench-press"],
  [/\bdips?\b/i, "dip"],
  [
    /reverse fly|reverse flye|rear delt fl|back flyes|reverse machine flyes|rear-delt|rear delt raise|rear lateral/i,
    "reverse-fly",
  ],
  [/flyes?\b|\bflye?\b|cross ?over|butterfly|iron cross/i, "fly"],
  [/lateral raise|side lateral|deltoid raise|scaption|power partials/i, "lateral-raise"],
  [/front .*raise|front raise|plate raise|straight raises|shoulder raise/i, "front-raise"],
  [/rotator|external rotation|internal rotation/i, "rotator-cuff"],
  [/push press/i, "push-press"],
  [
    /(military|shoulder|overhead|arnold|bradford|behind.?neck) press|jammer|thruster|pirate|para press|see-?saw press/i,
    "overhead-press",
  ],
  [/curl/i, "curl"],
  [
    /tricep.? extension|skull ?crusher|tate press|jm press|body-?up|body tricep|triceps press|towel triceps|overhead triceps/i,
    "triceps-extension",
  ],
  [/neck/i, "neck"],
  [/farmer|rickshaw carry|yoke walk|\bcarry\b|conan|backward walk/i, "carry"],
  [/sledgehammer|battl(e|ing) rope/i, "swing-slam-implement"],
  [/sled|prowler|backward drag|forward drag/i, "sled-push-drag"],
  [
    /atlas stone|\bstones?\b|\bkeg\b|log lift|sandbag|tire flip|power stairs/i,
    "strongman-load",
  ],
  [
    /slam|throw|chest pass|chest push|scoop|heavy bag|return push/i,
    "throw-slam",
  ],
  [/box jump|box skip|box shuffle|bench jump|depth jump/i, "box-jump"],
  [/long jump|broad jump/i, "broad-long-jump"],
  [
    /jump|\bhops?\b|hop\b|bound|leap|skipping|butt kick|push-off|stride/i,
    "plyometric-jump",
  ],
  [
    /sprint|carioca|quick step|wall drill|start technique|claw series|arm drill/i,
    "sprint-drill",
  ],
  [/rope climb/i, "rope-climb"],
  [/crawl/i, "crawl"],
];

const STRETCH_FAMILY_BY_MUSCLE = new Map([
  ["hamstrings", "hamstring-stretch"],
  ["quadriceps", "quad-hip-flexor-stretch"],
  ["hip flexors", "quad-hip-flexor-stretch"],
  ["glutes", "glute-piriformis-stretch"],
  ["abductors", "glute-piriformis-stretch"],
  ["adductors", "adductor-groin-stretch"],
  ["calves", "calf-ankle-stretch"],
  ["chest", "chest-shoulder-stretch"],
  ["shoulders", "chest-shoulder-stretch"],
  ["lats", "back-lat-stretch"],
  ["middle back", "back-lat-stretch"],
  ["lower back", "back-lat-stretch"],
  ["traps", "back-lat-stretch"],
  ["neck", "neck-stretch"],
  ["abdominals", "core-oblique-stretch"],
  ["biceps", "arm-forearm-stretch"],
  ["triceps", "arm-forearm-stretch"],
  ["forearms", "arm-forearm-stretch"],
]);

function squatVariant(name) {
  if (/box|bench/i.test(name)) return "Box & Bench";
  if (/single|split|pistol|one.leg/i.test(name)) return "Split & Single-Leg";
  if (/overhead/i.test(name)) return "Overhead";
  if (/smith|machine|hack|sissy|chair|leverage/i.test(name)) return "Machine";
  if (/front|goblet|plie|dumbbell|kettlebell/i.test(name)) {
    return "Front & Goblet";
  }
  return "Barbell";
}

export function createFamilyAssigner({ taxonomyRehome, familyRehome, variantGroups }) {
  const explicit = new Map();
  for (const { exercise, to } of taxonomyRehome) {
    const variant = SQUAT_SPLIT_VARIANT[to];
    explicit.set(
      exercise,
      variant !== undefined
        ? { family: "squat", variantGroup: variant }
        : { family: slugify(to), variantGroup: null },
    );
  }
  for (const [exercise, target] of Object.entries(familyRehome)) {
    explicit.set(exercise, { family: slugify(target), variantGroup: null });
  }
  for (const { family, exercise, variantGroup } of variantGroups) {
    explicit.set(exercise, { family: slugify(family), variantGroup });
  }

  return function assign(record) {
    const known = explicit.get(record.name);
    if (known !== undefined) return known;

    if (MANUAL_FAMILY.has(record.name)) {
      return { family: MANUAL_FAMILY.get(record.name), variantGroup: null };
    }

    if (record.equipment === "foam roll" || /-smr\b/i.test(record.name)) {
      return { family: "foam-rolling", variantGroup: null };
    }

    for (const [pattern, family] of NAME_RULES) {
      if (pattern.test(record.name)) {
        return {
          family,
          variantGroup:
            family === "squat" ? squatVariant(record.name) : null,
        };
      }
    }

    if (record.modality === "cardio") {
      return { family: "cardio", variantGroup: null };
    }
    if (record.modality === "stretching") {
      const muscle = record.primaryMuscles[0];
      return {
        family: STRETCH_FAMILY_BY_MUSCLE.get(muscle) ?? null,
        variantGroup: null,
      };
    }
    return { family: null, variantGroup: null };
  };
}
