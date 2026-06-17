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
  characters: [],
  worlds: [],
  locations: [],
  storySparks: [],
  themes: [],
  seriesSeeds: [],
  craftRules: []
} satisfies FirstPartyContentLibrary;
