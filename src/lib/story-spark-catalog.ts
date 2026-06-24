import type { GenrePreset } from "@/lib/types";

export type StorySparkCreatorKind = "founder" | "community" | "staff" | "system";
export type StorySparkProvenance = "human-created" | "community-created" | "system-seeded";
export type StorySparkMood =
  | "Mystery"
  | "Wonder"
  | "Emotional"
  | "Adventure"
  | "Strange"
  | "Hopeful"
  | "Dark"
  | "Reflective";

export interface StorySparkCreator {
  id: string;
  displayName: string;
  handle?: string;
  creatorKind: StorySparkCreatorKind;
  creditLine: string;
}

export interface StorySparkCatalogItem {
  id: string;
  title: string;
  premise: string;
  genre: GenrePreset;
  mood: StorySparkMood;
  heroName: string;
  heroRole: string;
  heroBio: string;
  worldName: string;
  world: string;
  seed: string;
  cast: string;
  rules: string;
  tags: string[];
  creator: StorySparkCreator;
  provenance: StorySparkProvenance;
  ipMarking: "Project Lantern IP asset";
  sourceArchivePath: string;
  sourceArchiveTitle: string;
}

export const TODD_PERRINE_STORYSPARK_CREATOR: StorySparkCreator = {
  id: "creator-todd-perrine",
  displayName: "Todd Perrine",
  handle: "@toddperrine",
  creatorKind: "founder",
  creditLine: "StorySpark by Todd Perrine"
};

export const HUMAN_CREATED_STORYSPARK_ARCHIVE_PATH =
  "docs/storyspark-library/2026-06-23-human-created-horror-and-frontier-sparks.md";

export const STORY_SPARK_CATALOG: StorySparkCatalogItem[] = [
  {
    id: "storyspark-panting-that-wasnt-the-dog",
    title: "The Panting That Wasn’t the Dog",
    premise: "A hiker and his dog hear panting from the wrong direction on a familiar trail, and something in the woods begins imitating the sounds of companionship.",
    genre: "Speculative Mystery",
    mood: "Dark",
    heroName: "Calder Voss",
    heroRole: "Solo hiker with a loyal dog",
    heroBio: "An experienced hiker who feels safest outdoors with his dog and knows the trail well enough to understand when the woods have started lying.",
    worldName: "The Listening Trail",
    world: ["A familiar trail system at dusk where trail markers shift, distances stretch, and sound travels in intimate, impossible ways.", "The woods feel ordinary at first: gravel, pine duff, old blazes, creek crossings, dog tags, breath in cold air.", "As the story progresses, the trail behaves as if it is listening and answering with borrowed sounds."].join("\n"),
    seed: ["Calder Voss is hiking with his dog when he hears panting behind him.", "He assumes the dog has fallen back, then sees the dog ahead of him, alert and silent.", "The panting continues from behind them.", "The unseen follower begins matching the rhythm of the dog’s breathing, then Calder’s breathing, then sounds almost like a person pretending to be a dog."].join("\n"),
    cast: ["Calder Voss - experienced hiker who trusts the trail and his dog more than his own nerves.", "Moss - Calder’s dog, emotional anchor and early warning system; not comic relief, not disposable, and never treated as a cheap shock device.", "The Imitator - unseen presence that uses the sounds of trust: panting, footfalls, tags, soft whining."].join("\n"),
    rules: ["Keep the horror quiet, auditory, and ambiguous.", "The dog must be emotionally important and must not be harmed for shock value.", "Let the reader feel the violation of trust before showing anything directly.", "End with residue and ambiguity rather than a monster explanation."].join("\n"),
    tags: ["dog", "hiking", "woods", "trail horror", "auditory horror", "uncanny companion", "low gore", "ambiguous ending"],
    creator: TODD_PERRINE_STORYSPARK_CREATOR,
    provenance: "human-created",
    ipMarking: "Project Lantern IP asset",
    sourceArchivePath: HUMAN_CREATED_STORYSPARK_ARCHIVE_PATH,
    sourceArchiveTitle: "Human-Created StorySparks — Dog Horror, Amoma, and Space Cowboy"
  },
  {
    id: "storyspark-something-dead-in-the-fur",
    title: "Something Dead in the Fur",
    premise: "After his dogs roll in something dead, a splash of contaminated wash water gets into a man’s eye, the carcass vanishes, and the dogs begin watching him as if he is changing.",
    genre: "Speculative Mystery",
    mood: "Dark",
    heroName: "Elias Rook",
    heroRole: "Dog owner dealing with an impossible contamination",
    heroBio: "A practical, loving dog owner who thinks he is handling an ordinary disgusting dog problem until his own senses become unreliable.",
    worldName: "The Backyard After the Walk",
    world: ["A domestic world of leashes, muddy paws, outdoor faucets, dog bowls, towels, backyard grass, and ordinary routines.", "The horror starts inside a familiar pet-owner chore and then makes the body and home feel contaminated.", "Reflections, puddles, dog eyes, and wash water become portals of perception rather than simple surfaces."].join("\n"),
    seed: ["Two dogs return from a walk reeking of decay.", "Their owner finds or suspects they rolled in something dead and washes them outside.", "Dirty water splashes into his eye.", "The next morning, the carcass is gone without scavenger marks or smell.", "His eye burns, his dreams change, and the dogs begin watching him as if they no longer fully recognize him."].join("\n"),
    cast: ["Elias Rook - practical dog owner, affectionate and annoyed before fear takes over.", "June and Olive - the dogs; carriers, witnesses, or unwilling participants, but not evil.", "The Vanished Carcass - unidentified remains that may be a body, lure, infection source, or perception parasite."].join("\n"),
    rules: ["Keep the body horror intimate and gross but not extreme.", "The dogs should remain emotionally meaningful and should be kept safe unless a future user explicitly asks for a darker version.", "Make the eye infection feel like a change in perception, not just a disease.", "Let domestic safety erode slowly."].join("\n"),
    tags: ["dogs", "contamination", "eye horror", "body horror", "domestic weird", "disappearing carcass", "transformation", "low-to-medium gore"],
    creator: TODD_PERRINE_STORYSPARK_CREATOR,
    provenance: "human-created",
    ipMarking: "Project Lantern IP asset",
    sourceArchivePath: HUMAN_CREATED_STORYSPARK_ARCHIVE_PATH,
    sourceArchiveTitle: "Human-Created StorySparks — Dog Horror, Amoma, and Space Cowboy"
  },
  {
    id: "storyspark-dogs-he-left-behind",
    title: "The Dogs He Left Behind",
    premise: "A disciplined runner with a buried history of cruelty or abandonment begins seeing impossible dogs on his route, and they lead him off course toward judgment, rescue, or restitution.",
    genre: "Speculative Mystery",
    mood: "Reflective",
    heroName: "Miles Arlen",
    heroRole: "Runner haunted by a moral debt",
    heroBio: "A controlled, disciplined runner who has built a clean life around motion and denial, but whose past with dogs refuses to stay buried.",
    worldName: "The Reckoning Route",
    world: ["A familiar running route that becomes ritual terrain: mile markers, trail crossings, old roads, drainage tunnels, empty lots, and places memory tries to avoid.", "Each mile removes the runner further from ordinary geography and closer to moral memory.", "The trail becomes a court without walls."].join("\n"),
    seed: ["Miles Arlen begins a familiar run and sees a dog he recognizes but knows should be dead, missing, or impossible.", "He ignores it and keeps running.", "More dogs appear, each tied to a memory he has rationalized or avoided.", "The route changes; the mile markers no longer make sense.", "The dogs lead him toward a place associated with what he did."].join("\n"),
    cast: ["Miles Arlen - disciplined runner who uses control and fitness to outrun his past.", "The Dogs - not simple ghosts; they may be memories, spirits, judges, guides, or manifestations of a debt.", "The Last Dog - the one that may offer punishment, rescue, or a chance at restitution."].join("\n"),
    rules: ["Do not make Miles cartoonishly evil.", "Keep the dogs morally complex: punishment, rescue, and memory should all remain possible.", "The horror should come from guilt becoming geography.", "Allow an ending with justice, rescue, or a chance to make restitution."].join("\n"),
    tags: ["runner", "dogs", "guilt", "trail", "moral horror", "ghost animals", "punishment", "rescue", "redemption", "low gore"],
    creator: TODD_PERRINE_STORYSPARK_CREATOR,
    provenance: "human-created",
    ipMarking: "Project Lantern IP asset",
    sourceArchivePath: HUMAN_CREATED_STORYSPARK_ARCHIVE_PATH,
    sourceArchiveTitle: "Human-Created StorySparks — Dog Horror, Amoma, and Space Cowboy"
  },
  {
    id: "storyspark-amoma-in-the-tide-pool",
    title: "Amoma in the Tide Pool",
    premise: "At a lavish beach party below a private estate, guests discover a strange creature in a tide pool, name her Amoma, and turn her into spectacle before realizing the party may be what is trapped.",
    genre: "Speculative Mystery",
    mood: "Strange",
    heroName: "Mara Vale",
    heroRole: "Guest who notices the tide pool is looking back",
    heroBio: "A watchful party guest who came to the estate to escape social performance, only to become the first person to understand that Amoma is not helpless.",
    worldName: "The Glass House Above the Tide Pools",
    world: ["A luxurious coastal estate above a private beach: glass walls, catered drinks, linen shirts, fire bowls, music, expensive indifference.", "Below the party, tide pools feel ancient, tidal, inhuman, and patient.", "The estate’s wealth contrasts with the biological wrongness in the pool."].join("\n"),
    seed: ["During a lavish beach party, someone finds a strange living creature in a tide pool below the estate.", "The guests call her Amoma.", "Phones come out; the discovery becomes entertainment.", "The tide pool deepens, reflects things that are not above it, and responds differently to each observer.", "Amoma seems wounded, helpless, or beautiful only because that is what the observers need her to be."].join("\n"),
    cast: ["Mara Vale - observant guest trying to escape the party’s performance culture.", "Amoma - female-coded creature, not a mermaid, pet, alien, or simple monster; possibly lure, larva, emissary, wound, organ, or intelligence.", "The Host - wealthy estate owner who wants to control anything discovered on the property.", "The Photographer - guest who turns the encounter into spectacle.", "The Protective Guest - someone whose pity becomes another form of invitation."].join("\n"),
    rules: ["Lovecraftian meets VanderMeer: beautiful, organic, wrong, increasingly terrifying.", "Do not make Amoma whimsical, cute, or a magical pet.", "Attention should feed the phenomenon.", "Let luxury, ownership, spectacle, and ecological dread collide.", "Do not over-explain the ending."].join("\n"),
    tags: ["Amoma", "tide pool", "luxury estate", "beach party", "cosmic horror", "eco-horror", "VanderMeer", "Lovecraftian", "wealth satire", "high weirdness"],
    creator: TODD_PERRINE_STORYSPARK_CREATOR,
    provenance: "human-created",
    ipMarking: "Project Lantern IP asset",
    sourceArchivePath: HUMAN_CREATED_STORYSPARK_ARCHIVE_PATH,
    sourceArchiveTitle: "Human-Created StorySparks — Dog Horror, Amoma, and Space Cowboy"
  },
  {
    id: "storyspark-space-cowboy-looping-frontier",
    title: "Space Cowboy / The Looping Frontier",
    premise: "A space-cowboy frontier adventure is revealed to be a sedation-based virtual world that humans enter voluntarily, but some can no longer return to their bodies.",
    genre: "Literary Science Fiction",
    mood: "Adventure",
    heroName: "Cal Ransom",
    heroRole: "Virtual frontier rider trapped in a designed freedom fantasy",
    heroBio: "A lone rider-pilot who entered the frontier because freedom is his defining desire, and whose longing for open horizons becomes the thing the world uses against him.",
    worldName: "The Looping Frontier",
    world: ["An immersive virtual frontier blending western myth and space opera: dust, stars, frontier towns, worn ships, orbital cattle drives, alien weather, artificial moons, old songs, and survival rituals.", "Humans enter by being physically sedated outside the experience while their minds inhabit the frontier.", "The world initially feels expansive and freeing. The horror is that the expanse is virtual, curated, closed, and the body is elsewhere."].join("\n"),
    seed: ["Cal Ransom rides through a dangerous but beautiful frontier world that feels alive.", "Small repetitions appear: a saloon line, a storm, a duel, a dead companion returning with no memory of dying.", "A promised exit fails to appear.", "Cal learns that entry required sedation and that his physical body is somewhere beyond reach.", "Each escape attempt resets the frontier into a darker, more targeted nightmare."].join("\n"),
    cast: ["Cal Ransom - lone rider, pilot, marshal, smuggler, or frontier drifter whose identity depends on freedom.", "Rhi Vale - another trapped user who remembers more loops than she admits.", "The Operator Voice - a system, company, human monitor, or protocol that may be trying to help, contain, or deceive.", "The Frontier - canonical virtual/metaverse-like world whose rules have become a prison; do not make it machine-authored."].join("\n"),
    rules: ["Canonical rule: this is a designed virtual/metaverse frontier, not a machine-authored setting. Do not frame the world as created by AI.", "The world is a virtual/metaverse-like frontier entered through sedation.", "The body outside the world is passive, monitored, vulnerable, and increasingly unreachable.", "The cowboy myth of freedom should become the prison’s operating system.", "The horror can come from platform design, corporate control, failed safety protocols, human operators, corrupted world rules, or complexity that prevents release."].join("\n"),
    tags: ["space cowboy", "sci-fi western", "virtual world", "metaverse horror", "sedation trap", "immersive frontier", "recursive nightmare", "frontier", "existential horror", "low gore"],
    creator: TODD_PERRINE_STORYSPARK_CREATOR,
    provenance: "human-created",
    ipMarking: "Project Lantern IP asset",
    sourceArchivePath: HUMAN_CREATED_STORYSPARK_ARCHIVE_PATH,
    sourceArchiveTitle: "Human-Created StorySparks — Dog Horror, Amoma, and Space Cowboy"
  }
];

export function getStorySparkCatalogItemById(id: string): StorySparkCatalogItem | null {
  return STORY_SPARK_CATALOG.find((item) => item.id === id) ?? null;
}
