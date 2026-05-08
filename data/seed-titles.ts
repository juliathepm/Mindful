/**
 * Hand-picked Wikipedia article titles for each seed card.
 * Used by scripts/enrich-seed.ts to fetch a topical lead image and by
 * data/seed.ts to attach the title at module load. Missing entries fall back
 * to the gradient-emoji image already on the card.
 */
export const SEED_WIKIPEDIA_TITLES: Record<string, string> = {
  // science
  "why-sky-blue": "Rayleigh scattering",
  "entropy-arrow": "Arrow of time",
  "crispr-scissors": "CRISPR",
  "speed-of-causality": "Speed of light",
  "warm-blooded-cost": "Warm-blooded",
  "atoms-mostly-empty": "Atom",

  // history
  "library-of-alexandria": "Library of Alexandria",
  "haitian-revolution": "Haitian Revolution",
  "longitude-prize": "John Harrison",
  "silk-road-disease": "Black Death",
  "rosetta-stone": "Rosetta Stone",
  "year-without-summer": "Year Without a Summer",

  // fact
  "octopus-three-hearts": "Octopus",
  "honey-immortal": "Honey",
  "banana-radioactive": "Banana equivalent dose",
  "oxford-older-aztec": "University of Oxford",
  "wombat-cube-poop": "Wombat",
  "shortest-war": "Anglo-Zanzibar War",

  // nature
  "mycelial-internet": "Mycorrhizal network",
  "tardigrade-survives": "Tardigrade",
  "old-clonal-forest": "Pando (tree)",
  "echolocation-mantis-shrimp": "Mantis shrimp",
  "salmon-magnetic": "Salmon",
  "trees-make-rain": "Amazon rainforest",

  // art
  "starry-night-sky": "The Starry Night",
  "hagia-sophia": "Hagia Sophia",
  "lascaux-cave-art": "Lascaux",
  "pantone-blue": "Blue",
  "japanese-kintsugi": "Kintsugi",
  "roman-concrete": "Roman concrete",

  // big_question — many of these are abstract; lookups may return no image.
  "ship-of-theseus": "Ship of Theseus",
  "chinese-room": "Chinese room",
  "veil-of-ignorance": "Original position",
  "fermi-paradox": "Fermi paradox",
  "trolley-broader": "Trolley problem",
  "consciousness-hard-problem": "Hard problem of consciousness",

  // food
  "spices-preservation": "Spice",
  "maillard-reaction": "Maillard reaction",
  "potato-empire": "Potato",
  "fermentation-everywhere": "Fermentation in food processing",
  "gelatin-collagen": "Gelatin",
  "umami-discovery": "Umami",
};
