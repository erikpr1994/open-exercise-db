// Composes the body of a "Sync exercise catalogue to open-exercise-db
// <tag>" issue for erikpr1994/peakhealth. Run after `npm run build`, with
// dist/exercises.json holding the just-published release and (if it
// exists) released/exercises.json holding the one before it — the same
// file the release workflows already download to detect a no-op release.
// Prints the issue body to stdout; the workflow pipes it into
// `gh issue create --repo erikpr1994/peakhealth`.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { computeDataChanges, formatDataChanges } from "./release-notes.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

const [, , tag, releaseUrl] = process.argv;
if (!tag || !releaseUrl) {
  console.error("usage: node scripts/notify-peakhealth.mjs <tag> <releaseUrl>");
  process.exit(1);
}

const current = JSON.parse(readFileSync(join(ROOT, "dist", "exercises.json"), "utf8"));
const previousPath = join(ROOT, "released", "exercises.json");
const released = existsSync(previousPath)
  ? JSON.parse(readFileSync(previousPath, "utf8"))
  : [];

const tombstones = new Map(
  JSON.parse(readFileSync(join(ROOT, "removed-exercises.json"), "utf8")).map((entry) => [
    entry.id,
    entry.reason,
  ]),
);

const { added, removed, modified } = computeDataChanges(current, released);
const dataChanges = formatDataChanges(current, added, removed, modified, tombstones);
const before = current.length - added.length + removed.length;

console.log(`open-exercise-db published release [${tag}](${releaseUrl}).

${dataChanges}

Row count: ${before} → ${current.length}.

### Do this

1. Run \`pnpm --filter @peakhealth/exercises sync\`. It takes the latest release and rewrites \`packages/exercises/src/catalogue.data.json\`, which is the only file it may write.
2. If the sync fails naming a vocabulary value the app does not hold, that failure is the design working and the value is a decision to take in five places: the union in \`packages/types/src/exercise.ts\`, the enum in \`packages/validation/src/exercise.ts\`, a label in \`packages/i18n/messages/en.json\` and \`es.json\`, and the \`Record<Equipment, string>\` maps in both \`apps/web/lib/labels.ts\` and \`apps/mobile/lib/labels.ts\`. The compiler names the last two.
3. Update the pinned row count in \`packages/exercises/src/catalogue.test.ts\`, which is a tripwire on exactly this change.
4. Check that no removed exercise id is referenced anywhere in that repository before regenerating.
5. Remove any vocabulary value this repository has tombstoned, but only once no row in the new release uses it.`);
