export type FirstPartyAssetType =
  | "character"
  | "world"
  | "location"
  | "story-spark"
  | "theme"
  | "series-seed"
  | "craft-rule";

export type FirstPartyIpStatus = "first-party";

export type FirstPartyAssetMetadata = {
  id: string;
  title: string;
  description: string;
  tags: string[];
  source: string;
  createdBy: string;
  ipOwner: string;
  ipStatus: FirstPartyIpStatus;
  usageRights: string;
};

export type FirstPartyAssetBase<Type extends FirstPartyAssetType> = FirstPartyAssetMetadata & {
  assetType: Type;
};

export type FirstPartyCharacter = FirstPartyAssetBase<"character">;
export type FirstPartyWorld = FirstPartyAssetBase<"world">;
export type FirstPartyLocation = FirstPartyAssetBase<"location">;
export type FirstPartyStorySpark = FirstPartyAssetBase<"story-spark">;
export type FirstPartyTheme = FirstPartyAssetBase<"theme">;
export type FirstPartySeriesSeed = FirstPartyAssetBase<"series-seed">;
export type FirstPartyCraftRule = FirstPartyAssetBase<"craft-rule">;

export type FirstPartyAsset =
  | FirstPartyCharacter
  | FirstPartyWorld
  | FirstPartyLocation
  | FirstPartyStorySpark
  | FirstPartyTheme
  | FirstPartySeriesSeed
  | FirstPartyCraftRule;

export type FirstPartyContentLibrary = {
  characters: FirstPartyCharacter[];
  worlds: FirstPartyWorld[];
  locations: FirstPartyLocation[];
  storySparks: FirstPartyStorySpark[];
  themes: FirstPartyTheme[];
  seriesSeeds: FirstPartySeriesSeed[];
  craftRules: FirstPartyCraftRule[];
};

export type FirstPartyCaptureTemplateField = {
  name: string;
  description: string;
};

export type FirstPartyCaptureTemplateExample = {
  rawNote: string;
  normalizedAsset: Pick<FirstPartyAssetMetadata, "title" | "description" | "tags">;
};

export type FirstPartyCaptureTemplate<Type extends FirstPartyAssetType> = {
  assetType: Type;
  requiredFields: FirstPartyCaptureTemplateField[];
  optionalFields: FirstPartyCaptureTemplateField[];
  ipMetadataDefaults: Pick<FirstPartyAssetMetadata, "source" | "createdBy" | "ipOwner" | "ipStatus" | "usageRights">;
  normalizationExamples: FirstPartyCaptureTemplateExample[];
};

export const DEFAULT_FIRST_PARTY_IP_METADATA = {
  source: "Bloodwick First-Party Library",
  createdBy: "Bloodwick",
  ipOwner: "Bloodwick",
  ipStatus: "first-party",
  usageRights: "Company-owned content for Bloodwick product use."
} satisfies Pick<FirstPartyAssetMetadata, "source" | "createdBy" | "ipOwner" | "ipStatus" | "usageRights">;

const SHARED_CAPTURE_REQUIRED_FIELDS = [
  { name: "id", description: "Stable kebab-case asset id with an asset-type prefix." },
  { name: "title", description: "Short display name for the reusable asset." },
  { name: "description", description: "One concise sentence that preserves the asset's story value." },
  { name: "tags", description: "Search and matching tags using existing tone, mood, and story-purpose language." }
] satisfies FirstPartyCaptureTemplateField[];

const SHARED_CAPTURE_OPTIONAL_FIELDS = [
  { name: "sourceNote", description: "Original spoken, raw, or workshop note before normalization." },
  { name: "audienceFit", description: "Reader-facing fit notes such as cozy, eerie, high-action, reflective, or younger-reader friendly." },
  { name: "continuityNotes", description: "Constraints that help future Living Series uses stay consistent." },
  { name: "avoid", description: "Specific details, tones, or implications that should not be used with this asset." }
] satisfies FirstPartyCaptureTemplateField[];

export const FIRST_PARTY_CAPTURE_TEMPLATES = {
  character: {
    assetType: "character",
    requiredFields: [
      ...SHARED_CAPTURE_REQUIRED_FIELDS,
      { name: "role", description: "The character's reusable story function, such as lead, ally, rival, mentor, or mystery figure." },
      { name: "definingTrait", description: "The memorable behavior, wound, want, or contradiction that makes the character recognizable." }
    ],
    optionalFields: [
      ...SHARED_CAPTURE_OPTIONAL_FIELDS,
      { name: "relationships", description: "Important bonds, tensions, or recurring dynamics with other assets." },
      { name: "visualCue", description: "A simple recognizable detail that can anchor future presentation or generation." }
    ],
    ipMetadataDefaults: DEFAULT_FIRST_PARTY_IP_METADATA,
    normalizationExamples: [
      {
        rawNote: "Kid courier, talks too much when nervous, always takes the weird shortcut.",
        normalizedAsset: {
          title: "Nervous Shortcut Courier",
          description: "A fast-talking courier whose nerves send them through impossible routes that often reveal the truth first.",
          tags: ["adventurous", "funny", "clues", "motion", "choice"]
        }
      }
    ]
  },
  world: {
    assetType: "world",
    requiredFields: [
      ...SHARED_CAPTURE_REQUIRED_FIELDS,
      { name: "coreRule", description: "The simple rule, premise, or recurring pressure that makes the world behave differently." },
      { name: "readerPromise", description: "The experience this world reliably offers, such as wonder, suspense, comfort, or discovery." }
    ],
    optionalFields: [
      ...SHARED_CAPTURE_OPTIONAL_FIELDS,
      { name: "recurringPlaces", description: "Locations that naturally belong inside this world." },
      { name: "socialTexture", description: "How people live, trade, gather, celebrate, or keep secrets here." }
    ],
    ipMetadataDefaults: DEFAULT_FIRST_PARTY_IP_METADATA,
    normalizationExamples: [
      {
        rawNote: "Town where every porch light answers another one after midnight, maybe like a code.",
        normalizedAsset: {
          title: "The Answering Lights",
          description: "A quiet town where porch lights blink messages after midnight and residents pretend not to understand them.",
          tags: ["mysterious", "cozy", "secrets", "community", "signals"]
        }
      }
    ]
  },
  location: {
    assetType: "location",
    requiredFields: [
      ...SHARED_CAPTURE_REQUIRED_FIELDS,
      { name: "settingFunction", description: "What this place does for a story, such as threshold, refuge, reveal point, test, or return path." },
      { name: "sensoryAnchor", description: "One concrete sound, image, texture, or ritual that makes the place easy to recall." }
    ],
    optionalFields: [
      ...SHARED_CAPTURE_OPTIONAL_FIELDS,
      { name: "connectedWorld", description: "World asset id or title this location naturally belongs to." },
      { name: "secret", description: "A hidden fact or unresolved question that can drive future episodes." }
    ],
    ipMetadataDefaults: DEFAULT_FIRST_PARTY_IP_METADATA,
    normalizationExamples: [
      {
        rawNote: "Tiny observatory over a tea shop, steam shows tomorrow's weather but only for one person.",
        normalizedAsset: {
          title: "Teashop Observatory",
          description: "A rooftop observatory where tea steam reveals one visitor's personal weather for the day ahead.",
          tags: ["relaxing", "thoughtful", "wonder", "cozy", "forecast"]
        }
      }
    ]
  },
  "story-spark": {
    assetType: "story-spark",
    requiredFields: [
      ...SHARED_CAPTURE_REQUIRED_FIELDS,
      { name: "incitingChange", description: "The event, arrival, discovery, loss, invitation, or warning that starts motion." },
      { name: "choicePressure", description: "The decision or emotional pressure the reader should feel through the premise." }
    ],
    optionalFields: [
      ...SHARED_CAPTURE_OPTIONAL_FIELDS,
      { name: "twistDirection", description: "A soft hint for how the spark might deepen without prescribing a full plot." },
      { name: "bestFitAssets", description: "Character, world, location, theme, or series seed ids this spark pairs well with." }
    ],
    ipMetadataDefaults: DEFAULT_FIRST_PARTY_IP_METADATA,
    normalizationExamples: [
      {
        rawNote: "Message shows up a day early and says don't trust the obvious answer.",
        normalizedAsset: {
          title: "The Early Warning",
          description: "A message arrives one day before it was written, warning the hero away from the answer everyone else accepts.",
          tags: ["mysterious", "clue", "choice", "time", "revelation"]
        }
      }
    ]
  },
  theme: {
    assetType: "theme",
    requiredFields: [
      ...SHARED_CAPTURE_REQUIRED_FIELDS,
      { name: "emotionalQuestion", description: "The human question the theme keeps returning to." },
      { name: "storyExpression", description: "How the theme should show up through choices, relationships, or consequences." }
    ],
    optionalFields: [
      ...SHARED_CAPTURE_OPTIONAL_FIELDS,
      { name: "counterpoint", description: "The opposing belief, fear, or temptation that makes the theme active." },
      { name: "toneFit", description: "Tones where this theme works especially well or poorly." }
    ],
    ipMetadataDefaults: DEFAULT_FIRST_PARTY_IP_METADATA,
    normalizationExamples: [
      {
        rawNote: "Small brave things, not big speeches. Choosing again when scared.",
        normalizedAsset: {
          title: "Courage in Small Steps",
          description: "Bravery grows through ordinary repeatable choices rather than grand declarations.",
          tags: ["thoughtful", "adventurous", "growth", "courage", "choice"]
        }
      }
    ]
  },
  "series-seed": {
    assetType: "series-seed",
    requiredFields: [
      ...SHARED_CAPTURE_REQUIRED_FIELDS,
      { name: "seriesPromise", description: "The repeatable reason a reader would return for another episode." },
      { name: "continuationEngine", description: "The mystery, journey, relationship, job, place, or ritual that can produce multiple episodes." }
    ],
    optionalFields: [
      ...SHARED_CAPTURE_OPTIONAL_FIELDS,
      { name: "starterCast", description: "Suggested character roles or existing character ids for the first version of the series." },
      { name: "episodePattern", description: "The natural rhythm of installments, such as case-of-the-week, journey stop, seasonal reveal, or cozy ritual." }
    ],
    ipMetadataDefaults: DEFAULT_FIRST_PARTY_IP_METADATA,
    normalizationExamples: [
      {
        rawNote: "Every week they repair a strange little machine and learn who it belonged to.",
        normalizedAsset: {
          title: "The Memory Repair Shop",
          description: "A gentle ongoing series about repairing impossible machines and uncovering the lives they quietly protected.",
          tags: ["relaxing", "emotional", "wonder", "memory", "episodic"]
        }
      }
    ]
  },
  "craft-rule": {
    assetType: "craft-rule",
    requiredFields: [
      ...SHARED_CAPTURE_REQUIRED_FIELDS,
      { name: "rule", description: "A clear reusable storytelling constraint or preference." },
      { name: "readerBenefit", description: "Why the rule improves the reader's experience." }
    ],
    optionalFields: [
      ...SHARED_CAPTURE_OPTIONAL_FIELDS,
      { name: "appliesTo", description: "Asset types, tones, series patterns, or episode moments where the rule is most useful." },
      { name: "exampleUse", description: "A short demonstration of the rule in practice." }
    ],
    ipMetadataDefaults: DEFAULT_FIRST_PARTY_IP_METADATA,
    normalizationExamples: [
      {
        rawNote: "Don't explain the weird thing right away; let one normal detail make it feel real first.",
        normalizedAsset: {
          title: "Ground Wonder Before Explaining It",
          description: "Introduce a strange element through one ordinary detail before naming how it works.",
          tags: ["craft", "wonder", "clarity", "immersion", "pacing"]
        }
      }
    ]
  }
} satisfies { [Type in FirstPartyAssetType]: FirstPartyCaptureTemplate<Type> };

export const FIRST_PARTY_LIBRARY = {
  characters: [
    {
      ...DEFAULT_FIRST_PARTY_IP_METADATA,
      id: "character-mara-vale",
      title: "Mara Vale",
      description: "A careful archivist who notices impossible details before anyone else is willing to name them.",
      tags: ["mysterious", "scary", "thoughtful", "clues", "memory"],
      assetType: "character"
    },
    {
      ...DEFAULT_FIRST_PARTY_IP_METADATA,
      id: "character-juno-pike",
      title: "Juno Pike",
      description: "A quick-talking courier whose jokes hide a brave streak and a habit of opening the wrong doors.",
      tags: ["funny", "adventurous", "surprise me", "chaos", "friendship"],
      assetType: "character"
    },
    {
      ...DEFAULT_FIRST_PARTY_IP_METADATA,
      id: "character-elin-ro",
      title: "Elin Ro",
      description: "A gentle repairer of small machines who believes every broken thing remembers how it wants to work.",
      tags: ["relaxing", "emotional", "thoughtful", "healing", "wonder"],
      assetType: "character"
    }
  ],
  worlds: [
    {
      ...DEFAULT_FIRST_PARTY_IP_METADATA,
      id: "world-the-lantern-coast",
      title: "The Lantern Coast",
      description: "A storm-bright shoreline where signal lights, old ferry routes, and quiet towns keep answering each other after dark.",
      tags: ["mysterious", "scary", "emotional", "coastal", "secrets"],
      assetType: "world"
    },
    {
      ...DEFAULT_FIRST_PARTY_IP_METADATA,
      id: "world-orbiting-market",
      title: "The Orbiting Market",
      description: "A moving bazaar above the clouds where every stall sells a shortcut, a warning, or a second chance.",
      tags: ["adventurous", "funny", "surprise me", "science fiction", "journey"],
      assetType: "world"
    },
    {
      ...DEFAULT_FIRST_PARTY_IP_METADATA,
      id: "world-quiet-hour-district",
      title: "Quiet Hour District",
      description: "A neighborhood that becomes softer and stranger each evening, as if the city is giving its residents room to breathe.",
      tags: ["relaxing", "thoughtful", "emotional", "magical realist", "home"],
      assetType: "world"
    }
  ],
  locations: [
    {
      ...DEFAULT_FIRST_PARTY_IP_METADATA,
      id: "location-underclock-station",
      title: "Underclock Station",
      description: "An abandoned platform beneath town where the clocks run backward only when someone is about to make a choice.",
      tags: ["mysterious", "scary", "thoughtful", "threshold", "time"],
      assetType: "location"
    },
    {
      ...DEFAULT_FIRST_PARTY_IP_METADATA,
      id: "location-last-kite-bridge",
      title: "Last Kite Bridge",
      description: "A wind-lashed crossing where travelers leave bright paper kites for luck before the road turns dangerous.",
      tags: ["adventurous", "emotional", "surprise me", "journey", "choice"],
      assetType: "location"
    },
    {
      ...DEFAULT_FIRST_PARTY_IP_METADATA,
      id: "location-teacup-observatory",
      title: "Teacup Observatory",
      description: "A tiny rooftop observatory that predicts personal weather in steam, starlight, and overheard wishes.",
      tags: ["funny", "relaxing", "thoughtful", "wonder", "cozy"],
      assetType: "location"
    }
  ],
  storySparks: [
    {
      ...DEFAULT_FIRST_PARTY_IP_METADATA,
      id: "spark-the-note-that-arrives-early",
      title: "The Note That Arrives Early",
      description: "A message reaches the hero one day before it was written, asking them not to trust the obvious answer.",
      tags: ["mysterious", "scary", "surprise me", "revelation", "clue"],
      assetType: "story-spark"
    },
    {
      ...DEFAULT_FIRST_PARTY_IP_METADATA,
      id: "spark-the-borrowed-bravery",
      title: "The Borrowed Bravery",
      description: "The hero wakes with someone else's courage and must decide what to do before it returns to its owner.",
      tags: ["adventurous", "emotional", "funny", "transformation", "choice"],
      assetType: "story-spark"
    },
    {
      ...DEFAULT_FIRST_PARTY_IP_METADATA,
      id: "spark-the-room-that-listens",
      title: "The Room That Listens",
      description: "A quiet room rearranges itself around whatever the hero cannot quite say aloud.",
      tags: ["relaxing", "thoughtful", "emotional", "healing", "memory"],
      assetType: "story-spark"
    }
  ],
  themes: [
    {
      ...DEFAULT_FIRST_PARTY_IP_METADATA,
      id: "theme-courage-in-small-steps",
      title: "Courage in Small Steps",
      description: "Bravery arrives through ordinary choices, not grand speeches.",
      tags: ["adventurous", "scary", "thoughtful", "growth", "courage"],
      assetType: "theme"
    },
    {
      ...DEFAULT_FIRST_PARTY_IP_METADATA,
      id: "theme-found-family-signals",
      title: "Found Family Signals",
      description: "People recognize each other through repeated signals, shared jokes, and careful attention.",
      tags: ["funny", "emotional", "relaxing", "connection", "belonging"],
      assetType: "theme"
    },
    {
      ...DEFAULT_FIRST_PARTY_IP_METADATA,
      id: "theme-truth-with-a-cost",
      title: "Truth with a Cost",
      description: "The answer matters because it asks the hero to give up a comforting falsehood.",
      tags: ["mysterious", "emotional", "surprise me", "revelation", "change"],
      assetType: "theme"
    }
  ],
  seriesSeeds: [],
  craftRules: []
} satisfies FirstPartyContentLibrary;
