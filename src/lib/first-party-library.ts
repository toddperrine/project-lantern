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

export const DEFAULT_FIRST_PARTY_IP_METADATA = {
  source: "Project Lantern First-Party Library",
  createdBy: "Project Lantern",
  ipOwner: "Project Lantern",
  ipStatus: "first-party",
  usageRights: "Company-owned content for Project Lantern product use."
} satisfies Pick<FirstPartyAssetMetadata, "source" | "createdBy" | "ipOwner" | "ipStatus" | "usageRights">;

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
