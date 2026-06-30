import { LENGTH_TARGETS } from "./types";
import type { GenerateStoryRequest, GenerateStoryResponse, LengthTarget, StoryDiagnostics } from "./types";
import { findStoryMetadataLeakPatterns, normalizeStoryText, removeStoryMetadataLeaks } from "./story-output";
import {
  countWords,
  extractCharacterNames,
  extractSettings,
  extractWorldRules
} from "./story-analysis";

export function generateFallbackStory(
  input: GenerateStoryRequest,
  diagnostics: StoryDiagnostics
): GenerateStoryResponse {
  const characters = extractCharacterNames(input.characterProfiles);
  const lengthSpec = getLengthTargetSpec(input.lengthTarget);
  const worldRules = extractWorldRules(input.worldBible);
  const narrativeRules = extractWorldRules(input.storyRules);
  const rules = [...worldRules, ...narrativeRules];
  const settings = extractSettings(input.worldBible);
  const cast = characters.length > 0 ? characters : ["Mara Vale", "Jonah Reed"];
  const selectedStoryFit = input.selectedStoryTypeChipLabel?.trim() || input.genrePreset;
  const setting = settings[0] ?? fallbackSettingForStoryFit(selectedStoryFit);
  const primaryRule = cleanFallbackRule(worldRules[0]) ?? "promises leave evidence in the places people try to forget";
  const secondaryRule = cleanFallbackRule(worldRules[1]) ?? "old bargains become dangerous when someone pretends they were never made";
  const narrativeRule = cleanFallbackRule(narrativeRules[0]) ?? "the choice that protects one person may expose everyone else";
  const premise = buildFallbackPremise(input.storySeed, selectedStoryFit);

  const paragraphs = [
    `By the time dawn opened over ${setting}, ${cast[0]} had already learned to distrust easy weather. The air was mild, the road was clear, and every sign pointed toward mercy, which made the morning feel slightly wrong. ${premise}. In another place, it might have sounded like rumor. Here, under the laws everyone knew and feared, it sounded like a summons.`,
    `${cast[0]} carried the town's old promises as one carries an old burn: not always visible, never absent. ${primaryRule}. That truth shaped every bargain, every silence, every hesitation before a threshold. When ${cast[1] ?? cast[0]} arrived with dust on their sleeves and an unfinished warning in their mouth, neither of them pretended the warning was simple.`,
    `They followed the first clue into streets that narrowed as if listening. People stepped aside without admitting they were afraid. A bell rang once from a tower no one had entered in years, and the sound moved through the stones like a remembered name. ${cast[0]} kept moving, not because courage came easily, but because someone had to notice what the town wanted buried.`,
    `At the market gate, the first consequence revealed itself. A child had drawn the old symbol in spilled flour, and the symbol had answered by turning all nearby shadows toward the north. ${cast[1] ?? cast[0]} wanted to wipe it away. ${cast[0]} stopped them, because ${secondaryRule}. To erase a sign before understanding it was to insult the power that had sent it.`,
    `So they questioned the witnesses. A baker remembered a stranger with silver-threaded cuffs. A guard remembered hearing footsteps after the street was empty. An old woman remembered nothing at all, which was the most frightening answer, because her kind of memory had survived famine, siege, and the winter when the river forgot how to thaw. The world was obeying its rules, not breaking them. That made the mystery harder.`,
    `The first belief belonged to ${cast[0]}: the world could evolve if people were brave enough to pay attention. The second belonged to ${cast[1] ?? cast[0]}: some broken systems should be reset before they learned to call cruelty tradition. Neither belief was completely right. Neither was completely wrong. The collision between them mattered more than the mechanism beneath the street.`,
    `By noon, the trail led below the city, into the archive of sealed doors. There ${cast[0]} found what the trouble had been pointing toward: not a villain, not a treasure, but a choice arranged like a blade. If they spoke the truth aloud, the city would be spared and one beloved name would be removed from every living memory. If they stayed silent, memory would remain intact, and the northward shadows would reach the wells by nightfall.`,
    `${cast[0]} did not decide quickly. Their consistency was not a cage; it was a compass. ${narrativeRule}. ${cast[1] ?? cast[0]} argued for the living. The empty archive argued for the dead. Above them, the city waited in all its fragile, ordinary splendor.`,
    `In the end, ${cast[0]} chose speech. The words were plain, almost disappointing, but the world heard them with terrible care. The shadows loosened. The wells cleared. Somewhere, a room emptied itself of portraits. Someone's favorite song became only a melody without a source. ${cast[0]} felt the loss pass through them and leave a clean, aching space where a name had been.`,
    `Evening came without triumph. The people called it deliverance because people need bright handles for heavy things. ${cast[0]} called it obedience to the world as it was, and also evidence that the world could still change without pretending cost had vanished. Beside them, ${cast[1] ?? cast[0]} said nothing for a long while, then placed a hand over their own heart as if checking that memory still lived there.`,
    `Years later, the story would be told differently in every house: as warning, sacrifice, proof, accusation. But in the truest version, the one ${cast[0]} never wrote down, it remained the tale of a hard premise planted in difficult soil, of rules honored at cost, and of characters who stayed themselves even when the world demanded a simpler ending.`
  ];

  let story = paragraphs.join("\n\n");
  let expansionAttempted = false;
  let expansionSucceeded = false;

  for (const paragraph of buildExpansionParagraphs(cast, primaryRule, secondaryRule, narrativeRule)) {
    if (countWords(story) >= lengthSpec.minWords) {
      break;
    }

    expansionAttempted = true;
    story += `\n\n${paragraph}`;
  }

  story = normalizeStoryText(trimToWordLimit(story, lengthSpec.maxWords));
  const metadataLeakPatternsFound = findStoryMetadataLeakPatterns(story);
  if (!story || metadataLeakPatternsFound.length) {
    throw new Error(`Fallback rejected for metadata leak: ${metadataLeakPatternsFound.join(", ") || "empty story"}`);
  }
  const wordCount = countWords(story);
  expansionSucceeded = expansionAttempted && wordCount >= lengthSpec.minWords;
  const underTargetNotice =
    wordCount < lengthSpec.minWords ? `Final story is below the selected ${formatLengthTarget(input.lengthTarget)} target.` : null;

  return {
    story,
    metadata: {
      wordCount,
      charactersUsed: cast.slice(0, 4),
      rulesReferenced: rules.slice(0, 6).filter(Boolean),
      source: "fallback",
      diagnostics: {
        ...diagnostics,
        notice: diagnostics.notice ?? underTargetNotice,
        genrePreset: input.genrePreset,
        narrativeArchitecture: input.narrativeArchitecture,
        characterArc: input.characterArc,
        endingType: input.endingType,
        lengthTarget: formatLengthTarget(input.lengthTarget),
        finalWordCount: wordCount,
        expansionAttempted,
        expansionSucceeded,
        underTargetNotice,
        blueprintGenerated: diagnostics.blueprintGenerated ?? false,
        blueprintSceneCount: diagnostics.blueprintSceneCount ?? 0,
        blueprintFailedReason: diagnostics.blueprintFailedReason,
        storyMetadataLeakGuardEnabled: true,
        fallbackMetadataLeakGuardEnabled: true,
        fallbackRejectedForMetadataLeak: false,
        metadataLeakPatternsFound: [],
        storyFitGenerationContextVersion: "v1"
      }
    }
  };
}

function buildExpansionParagraphs(cast: string[], primaryRule: string, secondaryRule: string, narrativeRule: string): string[] {
  const lead = cast[0];
  const companion = cast[1] ?? cast[0];

  return [
    `The shape of the trouble required more than atmosphere. The first clue, pressure, or rupture had to change what action was possible. ${lead} returned to the earliest sign and understood that it had not been an omen but a demand. From then on, every answer closed one door behind them.`,
    `The strange event could not remain decorative, and the central question could not resolve as a private feeling. ${lead} tested the world's account of itself against the visible evidence, while ${companion} pressed for a choice that would protect the people most likely to be harmed by delay.`,
    `Their arc bent under pressure. No one is proven by confession alone, so ${lead} had to act before certainty became comfortable. The decision cost them leverage, reputation, or safety, and the cost made the later revelation more than an idea.`,
    `Closure could not arrive clean. The central danger had to be faced, named, and altered, but something of its consequence would remain in the streets, in the cast, or in the rule everyone would remember differently afterward.`,
    `The aftermath did not arrive all at once. It settled in gestures: doors left open, names paused over, maps amended in cautious ink. ${lead} watched the world continue according to its laws, and that continuation was both comfort and sentence. Nothing had been cheated. Nothing had been easy. The choice had roots deep enough to trouble sleep and branches wide enough to shelter those who still needed shelter.`,
    `${companion} kept returning to the moment when haste had almost sounded like wisdom. ${secondaryRule}. The lesson was not gentle, but it was durable. It changed the way they listened at thresholds, the way they weighed a stranger's fear, and the way they counted the price of being right too late.`,
    `By the next morning, ordinary life had resumed its stubborn work. Bread cooled on counters. Wheels complained in the lanes. Someone laughed too loudly because silence felt dangerous. ${lead} accepted those small survivals as proof that the world had not forgiven them, exactly, but had allowed them to keep walking inside it.`,
    `No one agreed on what should be remembered first: the warning, the sacrifice, or the rule that had forced both into the open. ${primaryRule}. That was the version ${lead} trusted most, because it left no room for the comforting lie that courage can cancel consequence.`,
    `The final question did not ask whether they had won. It asked whether the world should evolve or be reset, and ${lead} had no answer clean enough to become a slogan. ${narrativeRule}. The best they could offer was a transformed life, one decision at a time.`,
    `When the final witness left, ${lead} and ${companion} remained behind long enough to feel the place settle. There was no applause, no clean absolution, only the quieter dignity of a danger met without breaking the shape of the world that made the meeting matter.`,
    `Later, when people tried to simplify the tale, ${lead} corrected only the parts that would lead someone into danger. They did not care whether they were called brave. They cared that the next person standing at the same threshold would know which laws held fast and which hopes could survive them.`,
    `${companion} carried away a different truth: loyalty was not agreement, and doubt was not betrayal. The two of them had argued because the stakes deserved argument. What endured afterward was not harmony, but trust strong enough to hold disagreement without turning it into exile.`,
    `So the story closed without pretending the wound had vanished. It closed with work still waiting, debts still marked, and the road still long. That was the only honest ending the place allowed: not peace, but a steadier hand reaching for the next difficult mercy.`
  ];
}

function trimToWordLimit(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return text.trim();
  }

  return `${words.slice(0, maxWords).join(" ").replace(/[,\s]+$/, "")}.`;
}

function getLengthTargetSpec(lengthTarget: LengthTarget) {
  return LENGTH_TARGETS.find((target) => target.value === lengthTarget) ?? LENGTH_TARGETS[1];
}

function formatLengthTarget(lengthTarget: LengthTarget): string {
  const target = getLengthTargetSpec(lengthTarget);
  return `${target.value}: ${target.minWords}-${target.maxWords} words`;
}

function buildFallbackPremise(storySeed: string, selectedStoryFit: string): string {
  const cleanedSeed = removeStoryMetadataLeaks(storySeed)
    .split(/\n{2,}|\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .find((line) => !findStoryMetadataLeakPatterns(line).length);
  if (cleanedSeed) return stripInstructionalPrefix(cleanedSeed);
  return `The ${selectedStoryFit.toLowerCase()} began with one ordinary detail that refused to stay ordinary`;
}

function cleanFallbackRule(value: string | undefined): string | null {
  if (!value) return null;
  const cleaned = removeStoryMetadataLeaks(value).split(/\n{2,}|\n/).map((line) => line.trim()).filter(Boolean)[0];
  if (!cleaned || findStoryMetadataLeakPatterns(cleaned).length) return null;
  return stripInstructionalPrefix(cleaned).replace(/[.:;]+$/, "");
}

function stripInstructionalPrefix(value: string): string {
  return value
    .replace(/^[-*]\s*/, "")
    .replace(/^(?:use|honor|require|center|turn|make|avoid|keep)\b[^.:;]*[.:;]\s*/i, "")
    .trim()
    .replace(/[.]+$/, "");
}

function fallbackSettingForStoryFit(selectedStoryFit: string): string {
  const fit = selectedStoryFit.toLowerCase();
  if (fit.includes("small-town")) return "Bellweather, a town whose welcome signs had begun to rust from the inside";
  if (fit.includes("cosmic")) return "the observatory ridge above a town that no longer trusted the stars";
  if (fit.includes("fairy")) return "the last lane before the woods, where every promise had a witness";
  if (fit.includes("nature")) return "the rain-dark trail behind the houses, where the trees leaned too close";
  if (fit.includes("haunted")) return "a family house that kept one room colder than the rest";
  return "a town where the familiar streets had started keeping secrets";
}
