// One-time image import. Provenance: free-exercise-db at pinned commit
// b0eed061e1c832b3ed815fbaa4b45b3cdc14df49 — download
// https://github.com/yuhonas/free-exercise-db/archive/<sha>.tar.gz and pass
// its extracted exercises/ directory. Source-id folders are renamed to the
// slug ids used by this repo (the same slugs generate-catalog.mjs writes,
// derived from the vendored dump in the Peak Health v2 repo).
//
// Usage: node scripts/import/copy-images.mjs <source-dump.json> <extracted-exercises-dir>

import { copyFile, mkdir, readFile, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { slugify } from "./slug.mjs";

const root = path.dirname(
  path.dirname(path.dirname(fileURLToPath(import.meta.url))),
);

const [sourceDump, imagesDir] = process.argv.slice(2);
if (!sourceDump || !imagesDir) {
  console.error(
    "Usage: node scripts/import/copy-images.mjs <source-dump.json> <extracted-exercises-dir>",
  );
  process.exit(1);
}

const records = JSON.parse(await readFile(sourceDump, "utf8"));

const target = path.join(root, "images");
await rm(target, { recursive: true, force: true });

let copied = 0;
for (const record of records) {
  const slug = slugify(record.name);
  await mkdir(path.join(target, slug), { recursive: true });
  for (const image of record.images) {
    await copyFile(
      path.join(imagesDir, image),
      path.join(target, slug, path.basename(image)),
    );
    copied += 1;
  }
}

console.log(`Copied ${copied} images for ${records.length} exercises.`);
