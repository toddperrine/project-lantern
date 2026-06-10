import { countWords, truncateWords } from './text';
import { buildStoryContext } from './worldParser';
import type { StoryGenerationRequest, StoryGenerationResponse } from '@/types/story';

const TARGET_MIN_WORDS = 1500;
const TARGET_MAX_WORDS = 2000;

type Scene = {
  title: string;
  purpose: string;
  emotionalTurn: string;
};

function sentenceList(items: string[], fallback: string): string {
  if (items.length === 0) {
    return fallback;
  }

  if (items.length === 1) {
    return items[0];
  }

  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
}

function getCharacter(characters: string[], index: number): string {
  return characters[index % characters.length];
}

function buildScene(scene: Scene, index: number, request: StoryGenerationRequest): string {
  const context = buildStoryContext(request.worldBible, request.characterProfiles, request.storySeed);
  const protagonist = getCharacter(context.characters, 0);
  const companion = getCharacter(context.characters, 1);
  const foil = getCharacter(context.characters, 2);
  const rule = context.worldRules[index % Math.max(context.worldRules.length, 1)] ?? 'every promise carries a visible consequence';
  const detail = context.sensoryDetails[index % Math.max(context.sensoryDetails.length, 1)] ?? 'lantern-lit streets where old maps are treated like legal testimony';
  const characterNote = context.characterNotes[index % Math.max(context.characterNotes.length, 1)] ?? `${protagonist} is careful with trust, ${companion} notices what others miss, and ${foil} measures loyalty by action rather than speech.`;

  return `## ${scene.title}

${detail} framed the hour like a warning, and ${protagonist} understood that the seed of the trouble was simple: ${context.premise}. In this world, simple things rarely stayed small. The first rule ${protagonist} measured every choice against was this: ${rule}. It was not a proverb, not a superstition, and not a line elders repeated to keep children obedient. It was a working fact of the world, as reliable as hunger or weather, and ignoring it had ruined better people than them.

${characterNote} That truth shaped the way ${protagonist} entered the scene: shoulders steady, voice low, attention divided between the visible danger and the rule beneath it. ${companion} followed close enough to help but far enough to read the room, while ${foil} waited where the shadows gathered, refusing to pretend this was only an errand. ${scene.purpose} The conflict did not arrive with drums. It arrived as a mismatch between what everyone wanted and what the world permitted.

For a time they tried the careful path. ${protagonist} asked questions that sounded harmless. ${companion} found the detail everyone else had stepped over: a mark, a missing word, a silence in the record. ${foil} pressed for speed, arguing that hesitation could become its own betrayal. Yet every answer narrowed the corridor around them. If they acted too soon, they would break the rule. If they waited too long, someone else would pay the cost. ${scene.emotionalTurn}

So ${protagonist} chose a third way. It was not clean, and it did not make them look heroic. They gave up the advantage they wanted most, named the cost aloud, and forced the hidden contradiction into the open. The world answered in its own language: a shifted light, a changed witness, a pressure easing where it had been unbearable. ${companion} smiled only after checking that everyone still stood. ${foil} did not apologize, but lowered their weapon, which from them meant almost the same thing.

By the end of the hour, nothing was solved forever. Good stories in consistent worlds do not erase their own rules. But the danger had changed shape. ${protagonist} had learned where the rule bent, where it held, and where character mattered more than cleverness. They carried that knowledge onward, altered by it, while the place behind them settled into a quieter kind of truth.`;
}

function buildDraft(request: StoryGenerationRequest): string {
  const context = buildStoryContext(request.worldBible, request.characterProfiles, request.storySeed);
  const cast = sentenceList(context.characters, 'a small cast of stubborn survivors');
  const rules = sentenceList(context.worldRules, 'the world rewards attention, punishes shortcuts, and remembers broken promises');
  const details = sentenceList(context.sensoryDetails, 'a borderland of old roads, bright windows, and weather that seems to listen');

  const scenes: Scene[] = [
    {
      title: 'The Rule Beneath the Door',
      purpose: 'The opening task became a test of whether the cast could solve a problem without violating the world that made them who they were.',
      emotionalTurn: `${getCharacter(context.characters, 0)} realized that fear had made the obvious answer look merciful, when it was only convenient.`,
    },
    {
      title: 'What the Witness Remembered',
      purpose: 'The investigation moved from public danger to private obligation, revealing how much each character was willing to risk to remain consistent with themselves.',
      emotionalTurn: `${getCharacter(context.characters, 1)} admitted the clue had personal meaning, and the admission changed the group from allies of circumstance into allies by choice.`,
    },
    {
      title: 'The Price of Keeping Faith',
      purpose: 'The climax forced the characters to honor the rules rather than escape them, turning limitation into the shape of the resolution.',
      emotionalTurn: `${getCharacter(context.characters, 2)} chose loyalty over victory, proving that consistency can be more dramatic than surprise.`,
    },
  ];

  return `# Story World Engine Draft

The story begins with ${cast} in ${details}. The seed is direct: ${context.premise}. The governing pressures are equally clear: ${rules}. What follows is an original short story designed to preserve those pressures instead of treating them as decoration.

${scenes.map((scene, index) => buildScene(scene, index, request)).join('\n\n')}

## Coda

Afterward, ${getCharacter(context.characters, 0)} did not tell the story as a victory. Victory made events sound finished, and nothing about the world allowed that kind of laziness. They told it as a correction: this is what we thought the rule meant, this is what it demanded when we were tired, and this is who we became when obeying it cost us something. ${getCharacter(context.characters, 1)} kept the practical record, noting the places where habit had almost led them wrong. ${getCharacter(context.characters, 2)} kept no record at all, but returned the next morning with supplies, which was the only confession anyone needed.

The world remained itself. Its laws did not soften because the characters had suffered, and its mysteries did not step aside because someone had finally understood one corner of them. That was why the ending mattered. The characters had not conquered the setting; they had learned to move through it honestly. In a lesser tale, the seed would have become an excuse for spectacle. Here it became a promise kept under pressure, and the promise left a door open for the next story.`;
}

function padToMinimumWords(story: string, request: StoryGenerationRequest): string {
  const context = buildStoryContext(request.worldBible, request.characterProfiles, request.storySeed);
  let expanded = story;
  let index = 0;

  while (countWords(expanded) < TARGET_MIN_WORDS && index < 6) {
    const character = getCharacter(context.characters, index);
    const rule = context.worldRules[index % Math.max(context.worldRules.length, 1)] ?? 'the world keeps exact account of careless choices';
    expanded += `\n\n${character} carried one more consequence from the encounter: ${rule}. That consequence mattered because it translated the world bible into behavior. It changed how ${character} spoke, what they withheld, and which risk they refused to pass to someone weaker. The story therefore stayed anchored in character rather than spectacle; every outward event left an inward mark, and every inward mark altered the next decision.`;
    index += 1;
  }

  return expanded;
}

export function generateStory(request: StoryGenerationRequest): StoryGenerationResponse {
  const context = buildStoryContext(request.worldBible, request.characterProfiles, request.storySeed);
  const draft = padToMinimumWords(buildDraft(request), request);
  const story = countWords(draft) > TARGET_MAX_WORDS ? truncateWords(draft, TARGET_MAX_WORDS) : draft;

  return {
    story,
    metadata: {
      wordCount: countWords(story),
      charactersUsed: context.characters,
      rulesReferenced: context.worldRules,
    },
  };
}
