import type { GenerateStoryRequest, GenerateStoryResponse } from "./types";
import {
  countWords,
  extractCharacterNames,
  extractSettings,
  extractWorldRules
} from "./story-analysis";

const TARGET_MIN = 1500;
const TARGET_MAX = 2000;

export function generateFallbackStory(input: GenerateStoryRequest): GenerateStoryResponse {
  const characters = extractCharacterNames(input.characterProfiles);
  const rules = extractWorldRules(input.worldBible);
  const settings = extractSettings(input.worldBible);
  const cast = characters.length > 0 ? characters : ["the keeper", "the witness"];
  const setting = settings[0] ?? "the borderland where the old maps lose confidence";
  const primaryRule = rules[0] ?? "every choice leaves a visible mark on the world";
  const secondaryRule = rules[1] ?? "promises carry more weight than steel";

  const paragraphs = [
    `By the time dawn opened over ${setting}, ${cast[0]} had already learned to distrust easy weather. The air was mild, the road was clear, and every sign pointed toward mercy, which made the morning feel like a trap laid with polished hands. The matter began with the seed of a story: ${input.storySeed.trim()}. In another place, it might have sounded like rumor. Here, under the laws everyone knew and feared, it sounded like a summons.`,
    `${cast[0]} carried the knowledge of the world bible as one carries an old burn: not always visible, never absent. ${primaryRule}. That truth shaped every bargain, every silence, every hesitation before a threshold. When ${cast[1] ?? cast[0]} arrived with dust on their sleeves and an unfinished warning in their mouth, neither of them pretended the warning was simple.`,
    `They followed the seed into streets that narrowed as if listening. People stepped aside without admitting they were afraid. A bell rang once from a tower no one had entered in years, and the sound moved through the stones like a remembered name. ${cast[0]} thought of the profiles that had made them who they were: the wound they concealed, the loyalty that could become stubbornness, the private rule by which they measured courage.`,
    `At the market gate, the first consequence revealed itself. A child had drawn the old symbol in spilled flour, and the symbol had answered by turning all nearby shadows toward the north. ${cast[1] ?? cast[0]} wanted to wipe it away. ${cast[0]} stopped them, because ${secondaryRule}. To erase a sign before understanding it was to insult the power that had sent it.`,
    `So they questioned the witnesses. A baker remembered a stranger with silver-threaded cuffs. A guard remembered hearing footsteps after the street was empty. An old woman remembered nothing at all, which was the most frightening answer, because her kind of memory had survived famine, siege, and the winter when the river forgot how to thaw. The world was obeying its rules, not breaking them. That made the mystery harder.`,
    `By noon, the trail led below the city, into the archive of sealed doors. There ${cast[0]} found what the seed had been pointing toward: not a villain, not a treasure, but a choice arranged like a blade. If they spoke the truth aloud, the city would be spared and one beloved name would be removed from every living memory. If they stayed silent, memory would remain intact, and the northward shadows would reach the wells by nightfall.`,
    `${cast[0]} did not decide quickly. Their consistency was not a cage; it was a compass. They had always believed that a person became real through the promises they kept when no witness remained. ${cast[1] ?? cast[0]} argued for the living. The empty archive argued for the dead. Above them, the city waited in all its fragile, ordinary splendor.`,
    `In the end, ${cast[0]} chose speech. The words were plain, almost disappointing, but the world heard them with terrible care. The shadows loosened. The wells cleared. Somewhere, a room emptied itself of portraits. Someone's favorite song became only a melody without a source. ${cast[0]} felt the loss pass through them and leave a clean, aching space where a name had been.`,
    `Evening came without triumph. The people called it deliverance because people need bright handles for heavy things. ${cast[0]} called it obedience to the world as it was. Beside them, ${cast[1] ?? cast[0]} said nothing for a long while, then placed a hand over their own heart as if checking that memory still lived there.`,
    `Years later, the story would be told differently in every house: as warning, sacrifice, proof, accusation. But in the truest version, the one ${cast[0]} never wrote down, it remained the tale of a seed planted in difficult soil, of rules honored at cost, and of characters who stayed themselves even when the world demanded a simpler ending.`
  ];

  let story = paragraphs.join("\n\n");
  while (countWords(story) < TARGET_MIN) {
    story += `\n\nThe aftermath did not arrive all at once. It settled in gestures: doors left open, names paused over, maps amended in cautious ink. ${cast[0]} watched the world continue according to its laws, and that continuation was both comfort and sentence. Nothing had been cheated. Nothing had been easy. The seed had grown into a story with roots deep enough to trouble sleep and branches wide enough to shelter those who still needed shelter.`;
  }

  story = trimToWordLimit(story, TARGET_MAX);

  return {
    story,
    metadata: {
      wordCount: countWords(story),
      charactersUsed: cast.slice(0, 4),
      rulesReferenced: [primaryRule, secondaryRule].filter(Boolean),
      source: "fallback"
    }
  };
}

function trimToWordLimit(text: string, maxWords: number): string {
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) {
    return text;
  }

  return `${words.slice(0, maxWords).join(" ").replace(/[,\s]+$/, "")}.`;
}
