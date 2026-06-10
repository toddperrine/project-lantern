import type { GenerateStoryRequest, GenerateStoryResponse, StoryDiagnostics } from "./types";
import {
  countWords,
  extractCharacterNames,
  extractSettings,
  extractWorldRules
} from "./story-analysis";

const TARGET_MIN = 1500;
const TARGET_MAX = 2000;

export function generateFallbackStory(
  input: GenerateStoryRequest,
  diagnostics: StoryDiagnostics
): GenerateStoryResponse {
  const characters = extractCharacterNames(input.characterProfiles);
  const worldRules = extractWorldRules(input.worldBible);
  const narrativeRules = extractWorldRules(input.storyRules);
  const rules = [...worldRules, ...narrativeRules];
  const settings = extractSettings(input.worldBible);
  const cast = characters.length > 0 ? characters : ["the keeper", "the witness"];
  const setting = settings[0] ?? "the borderland where the old maps lose confidence";
  const primaryRule = worldRules[0] ?? "every choice leaves a visible mark on the world";
  const secondaryRule = worldRules[1] ?? "promises carry more weight than steel";
  const narrativeRule = narrativeRules[0] ?? "character decisions matter more than plot mechanics";
  const premise = input.storySeed.trim();

  const paragraphs = [
    `By the time dawn opened over ${setting}, ${cast[0]} had already learned to distrust easy weather. The air was mild, the road was clear, and every sign pointed toward mercy, which made the morning feel slightly wrong. The trouble began with a premise that would not stay quiet: ${premise}. In another place, it might have sounded like rumor. Here, under the laws everyone knew and feared, it sounded like a summons.`,
    `${cast[0]} carried the local canon as one carries an old burn: not always visible, never absent. ${primaryRule}. That truth shaped every bargain, every silence, every hesitation before a threshold. When ${cast[1] ?? cast[0]} arrived with dust on their sleeves and an unfinished warning in their mouth, neither of them pretended the warning was simple.`,
    `They followed the premise into streets that narrowed as if listening. People stepped aside without admitting they were afraid. A bell rang once from a tower no one had entered in years, and the sound moved through the stones like a remembered name. ${cast[0]} thought of the profiles that had made them who they were: the wound they concealed, the loyalty that could become stubbornness, the private rule by which they measured courage.`,
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
  for (const paragraph of buildExpansionParagraphs(cast, primaryRule, secondaryRule, narrativeRule)) {
    if (countWords(story) >= TARGET_MIN) {
      break;
    }

    story += `\n\n${paragraph}`;
  }

  story = trimToWordLimit(story, TARGET_MAX);

  return {
    story,
    metadata: {
      wordCount: countWords(story),
      charactersUsed: cast.slice(0, 4),
      rulesReferenced: rules.slice(0, 6).filter(Boolean),
      source: "fallback",
      diagnostics
    }
  };
}

function buildExpansionParagraphs(cast: string[], primaryRule: string, secondaryRule: string, narrativeRule: string): string[] {
  const lead = cast[0];
  const companion = cast[1] ?? cast[0];

  return [
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
    return text;
  }

  return `${words.slice(0, maxWords).join(" ").replace(/[,\s]+$/, "")}.`;
}
