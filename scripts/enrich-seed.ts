import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { SEED_CARDS } from "../data/seed";
import { fetchWikipediaImage } from "../lib/wikipedia";
import type { CardImage } from "../lib/types";

const OUT_PATH = join(process.cwd(), "data", "seed-images.json");

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const out: Record<string, CardImage> = {};
  let ok = 0;
  let skipped = 0;
  let failed = 0;

  for (const card of SEED_CARDS) {
    if (!card.wikipediaTitle) {
      skipped++;
      continue;
    }
    process.stdout.write(`[${card.id}] ${card.wikipediaTitle} ... `);
    try {
      const img = await fetchWikipediaImage(card.wikipediaTitle);
      if (img) {
        out[card.id] = img;
        ok++;
        console.log("ok");
      } else {
        failed++;
        console.log("no image");
      }
    } catch (err) {
      failed++;
      console.log(`error: ${err instanceof Error ? err.message : String(err)}`);
    }
    // Be polite to Wikipedia.
    await sleep(250);
  }

  writeFileSync(OUT_PATH, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`\nDone. Resolved ${ok}, no-image ${failed}, skipped (no title) ${skipped}.`);
  console.log(`Wrote ${OUT_PATH}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
