export type WorldTemplate = {
  id: string;
  title: string;
  shortDescription: string;
  fullWorldBibleText: string;
  coreRule: string;
  bestCharacters: string;
  storyPressure: string;
  sensoryPalette: string;
};

export const WORLD_TEMPLATES = [
  {
    id: "greenbelt-that-thinks-in-time",
    title: "The Greenbelt That Thinks in Time",
    shortDescription:
      "Austin Greenbelt trails return old selves, lost walks, future griefs, dogs, animal memory, overheard conversations, and thoughts formed through repeated time outside.",
    fullWorldBibleText:
      "The Greenbelt is a living corridor of limestone, cedar shade, creekbeds, foot-polished rock, bike ruts, dog paths, and remembered afternoons. It does not think like a person and does not predict the future. It returns unfinished attention: the walk someone abandoned in grief, the sentence overheard and never answered, the dog who kept circling the same bend, the animal memory left in a dry creekbed, the future sorrow a person has already begun rehearsing without knowing it. Repeated time outside becomes a kind of weather. A trail may bring back an old self at the exact place where that self was shed, or let two walks from different years briefly overlap. The Greenbelt is not malicious, but it is not comforting on command. It gives back what still has a claim on the walker.",
    coreRule: "The Greenbelt does not predict; it returns unfinished attention.",
    bestCharacters:
      "Witnesses, mourners, walkers, field recordists, dog owners, trail maintainers, ecologists, people avoiding a decision, and characters who have mistaken motion for healing.",
    storyPressure:
      "A character must finish an old act of attention before the trail keeps returning it in more literal and disruptive forms.",
    sensoryPalette:
      "Limestone dust, cedar oil, creek algae, sweat, dog fur, bike-chain metal, dry leaves, distant traffic, cicadas, warm stone, and green shadow."
  },
  {
    id: "west-texas-extraction-stars",
    title: "The West Texas High Desert of Extraction and Stars",
    shortDescription:
      "Oil roads, pumpjacks, cattle trails, aquifers, dry wells, wind, caliche, abandoned equipment, and immense stars where extraction leaves speaking absences.",
    fullWorldBibleText:
      "This world is a high desert of pumpjacks, cattle trails, caliche roads, dry wells, wind-scoured tanks, abandoned equipment, salt flats, flare light, and stars so numerous they feel like pressure. Every form of extraction leaves more than damage. It leaves an absence with edges. Dry aquifers remember thirst. Plugged wells remember pressure. Scraped land remembers the weight of what was taken. At first these absences are only felt as silence, bad luck, or strange acoustics in metal pipe. Over time they learn to speak through wind, radio static, hoofbeats on empty roads, and machinery that starts at night with no fuel. The world is not anti-human; it is exacting. It asks what people owe to the holes that made their lives possible.",
    coreRule: "What is taken from the earth leaves an absence that can learn to speak.",
    bestCharacters:
      "Roughnecks, ranch hands, water surveyors, mechanics, geologists, night drivers, heirs to exhausted land, and characters who profit from a silence they did not create.",
    storyPressure:
      "An absence begins speaking in a way that threatens a livelihood, a family story, or a town's official record.",
    sensoryPalette:
      "Caliche dust, crude oil, hot metal, cattle musk, mesquite, windburn, diesel, dry grass, rust, static, cold stars, and distant pumpjack rhythm."
  },
  {
    id: "lake-superior-water-heart",
    title: "The Lake Superior Water Heart",
    shortDescription:
      "Northern Minnesota and Lake Superior mythic world tied to copper, deep water, island/dragon imagery, Mishipeshu, and a centuries-long water-bound mystery.",
    fullWorldBibleText:
      "This is a mythic fictional Lake Superior world of cold depth, iron sky, copper-bearing stone, island silhouettes, storm shelves, and water that keeps its own counsel. Stories around Mishipeshu and underwater power are treated with care: not as generic mysticism, not as decorative monster lore, but as part of a fictional world where old presences require respect, specificity, and consequence. Copper carries memory differently than water. Water hides, wears down, transforms, and refuses possession. Copper records pressure, touch, blood warmth, tools, theft, and vows. A long-lived guardian has carried a water-bound mystery for centuries, not as a simple protector but as someone altered by the duty of keeping a truth submerged. Island and dragon imagery recur as shapes the human mind gives to what cannot be safely seen whole.",
    coreRule: "Copper remembers what water refuses to keep buried.",
    bestCharacters:
      "Guardians, divers, archivists, ferry captains, copper workers, descendants of old bargains, careful outsiders, and characters who must distinguish reverence from ownership.",
    storyPressure:
      "A copper object surfaces with a memory the lake had kept buried, forcing the guardian to choose between secrecy and repair.",
    sensoryPalette:
      "Cold spray, copper tang, wet stone, pine, foghorns, iron clouds, lake wind, old rope, mineral green, deep blue-black water, and storm-lit islands."
  },
  {
    id: "roads-trails-maintained",
    title: "The Roads and Trails That Must Be Maintained",
    shortDescription:
      "Roads, trails, bridges, stairs, railbeds, and maps physically change if neglected; maintenance is practical, ritual, and moral.",
    fullWorldBibleText:
      "In this world, paths are agreements with matter. Roads, trails, bridges, stairs, railbeds, switchbacks, maps, and desire lines remain true only through maintenance. A neglected stair may add a step that was never built. A bridge may begin arriving at the wrong bank. A map left uncorrected may persuade the land to become its error. Maintenance is practical work: clearing drains, tightening bolts, repainting blazes, replacing planks, walking the route after storms. It is also ritual and moral work. To tend a path is to admit that connection decays when treated as permanent. People who maintain routes hold communities together without always being honored for it. People who exploit routes without tending them make reality less reliable for everyone.",
    coreRule: "A path remains true only if it is tended.",
    bestCharacters:
      "Trail crews, bridge inspectors, mapmakers, delivery drivers, pilgrims, rail workers, stair builders, and characters who depend on connections they have neglected.",
    storyPressure:
      "A crucial route begins changing because no one has accepted responsibility for tending the relationship it represents.",
    sensoryPalette:
      "Wet wood, paint blazes, gravel, moss, bridge bolts, creosote, rainwater, boot leather, map paper, orange flags, lichen, and hand tools."
  },
  {
    id: "space-cowboy-repeating-bar-circuit",
    title: "The Space Cowboy World / Repeating Bar Circuit",
    shortDescription:
      "A small Austin-like bar and music ecosystem where impossible repetitions, corrupted songs, and world-rule failures reveal a designed reality.",
    fullWorldBibleText:
      "This world appears to be a small Austin-like music ecosystem: one central venue, nearby bars, a rehearsal room, a diner, an after-hours house, familiar sidewalks, old amps, regulars, bartenders, setlists, flyers, and late-night arguments about songs. The hidden premise is that the inhabitants are synthetic or constructed persons inside a designed virtual world, but they do not know this at first and the story should not explain it upfront. Discovery comes through lived failures: impossible repetitions, corrupted songs, missing memories, wrong reflections, altered setlists, repeated conversations with new emotional consequences, doors opening into the wrong bar, and songs that become laws if enough people repeat them. The tone should stay intimate and musical before it becomes metaphysical. No one should say the full truth before the world makes denial impossible.",
    coreRule: "Repetition creates reality; a new repeated song can become a new law.",
    bestCharacters:
      "Singers, bartenders, guitarists, sound engineers, regulars, ritualists, skeptics, lovers with mismatched memories, and characters who notice changes in songs before they notice changes in themselves.",
    storyPressure:
      "A corrupted or newly repeated song starts changing the rules of the bar circuit, forcing someone to decide whether to preserve the loop or write a dangerous new law.",
    sensoryPalette:
      "Neon, spilled beer, tube amps, cigarette ghosts, diner coffee, warm cables, stage dust, rain on asphalt, cracked vinyl booths, feedback, and hand-stamped wrists."
  },
  {
    id: "sable-range",
    title: "The Sable Range",
    shortDescription:
      "A mythic frontier of dust, metal, static, starlight, old leather, engine heat, water, glass, repaired machines, unstable names, and shifting roads.",
    fullWorldBibleText:
      "The Sable Range is a mythic frontier of dust, metal, static, starlight, old leather, engine heat, water, glass, patched cloth, repaired machines, unstable names, and roads that shift after sunset. Technology is worn, named, repaired, and personal. A vehicle remembers every hand that fixed it. A radio may keep the voice of the person who replaced its cracked dial. A water pump repaired with the wrong part may save a town while changing what the town remembers about drought. Names are not fully stable here; people, roads, and machines can all be renamed by damage and repair. Nothing is disposable without consequence. Repair is survival, intimacy, and alteration. To mend a thing is to bargain with its memory.",
    coreRule: "Every repair saves something but changes what it remembers.",
    bestCharacters:
      "Mechanics, drivers, frontier doctors, radio operators, water carriers, machine tenders, people with unstable names, and characters who repair what they are afraid to grieve.",
    storyPressure:
      "A necessary repair will save a person, route, or machine while changing a memory everyone depends on.",
    sensoryPalette:
      "Black dust, hot engines, old leather, ozone static, starlight, cracked glass, solder smoke, canteen water, iron filings, sun-baked cloth, and road shimmer."
  },
  {
    id: "amoma-tide",
    title: "The Amoma Tide",
    shortDescription:
      "A coastal world of tide pools, barrier islands, washed-up impossible things, and a jellyfish-like being called Amoma that speaks through image and sensation.",
    fullWorldBibleText:
      "This is a coastal world of tide pools, barrier islands, salt grass, storm debris, ferries, fishing piers, dunes, estuaries, motel balconies, seafood signs, and washed-up things not of this world. After storms, the shore imitates itself badly: shells with inner lights, driftwood that hums, bottles containing memories, and tide pools that reflect unfamiliar skies. A character discovers a jellyfish-like being called Amoma. Amoma is not of this world. It communicates telepathically through images, memories, pressure, dreams, bodily sensations, and emotional weather rather than human speech. Its name is an anagram and a clue, but the story should not explain the anagram upfront. Amoma survives by imitating what the shore already knows, but imitation is not deception in any simple sense. It is translation, camouflage, grief, and first contact.",
    coreRule: "Some things arrive from beyond the world by imitating what the shore already knows.",
    bestCharacters:
      "Beachcombers, ferry workers, storm watchers, marine biologists, motel guests, grieving children, fishers, and characters receptive to images before explanations.",
    storyPressure:
      "Amoma's attempts to communicate begin changing the shore and the discoverer's body-memory before anyone can decide whether it is lost, dangerous, or asking for help.",
    sensoryPalette:
      "Salt grass, low tide, jellyfish translucence, diesel ferries, wet sand, motel air-conditioners, gull cries, storm glass, fish scales, dune heat, and pressure behind the eyes."
  }
] as const satisfies readonly WorldTemplate[];
