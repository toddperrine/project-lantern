export type CharacterArchetypePreset = {
  name: string;
  archetype: string;
  enneagram: string;
  function: string;
  coreDesire: string;
  coreFear: string;
  backstory: string;
  conflictEngine: string;
};

export const CHARACTER_ARCHETYPE_PRESETS = [
  {
    name: "Mara Venn",
    archetype: "The Witness Who Remembers Wrong",
    enneagram: "6w5",
    function:
      "Tests every accepted history by noticing which memories arrive with the wrong weather, the wrong witnesses, or a grief nobody else admits.",
    coreDesire: "To find one trustworthy account of what happened and anchor herself to it.",
    coreFear: "That her loyalty is built on a false memory that keeps harming the living.",
    backstory:
      "Mara survived an event that the world officially records as impossible. Since then, her testimony changes in small ways each time she tells it, yet every version contains one detail that later proves true.",
    conflictEngine:
      "Mara can expose a broken rule only by trusting the least stable part of herself, forcing allies to choose between official evidence and her unreliable remembrance."
  },
  {
    name: "Elias Root",
    archetype: "The Keeper of the Original Pattern",
    enneagram: "1w9",
    function:
      "Preserves the first pattern of a world, ritual, ecology, or machine so later changes can be measured against what was once whole.",
    coreDesire: "To restore order without becoming cruel in the name of repair.",
    coreFear: "That compromise will let the original pattern disappear forever.",
    backstory:
      "Elias was trained to maintain a foundational design whose makers are gone. He has corrected tiny deviations for decades, but the pattern may have been flawed from the beginning.",
    conflictEngine:
      "Elias must decide whether fidelity to the original order is wisdom or cowardice when a new pattern begins saving the people his old rules quietly failed."
  },
  {
    name: "Juno Vale",
    archetype: "The Carrier of the New Pattern",
    enneagram: "7w6",
    function:
      "Introduces transformation before anyone is ready, carrying a dangerous future in jokes, maps, songs, mutations, or contagious hope.",
    coreDesire: "To keep possibility alive long enough for others to cross into it.",
    coreFear: "That the new pattern will become another cage once people depend on it.",
    backstory:
      "Juno returned from a road that no longer exists with a changed body, a changed laugh, and instructions she only understands when she is moving.",
    conflictEngine:
      "Juno's gifts open exits from a failing world, but every escape asks someone to abandon a beloved certainty or become unrecognizable."
  },
  {
    name: "Calder Wren",
    archetype: "The Failsafe Who Refuses Their Function",
    enneagram: "9w8",
    function:
      "Embodies a hidden emergency protocol designed to stop catastrophe, yet resists being reduced to the act they were built to perform.",
    coreDesire: "To choose peace as a person rather than enforce it as a mechanism.",
    coreFear: "That the gentlest decision available to him is still annihilation.",
    backstory:
      "Calder was raised as ordinary until the old safeguards began waking in his bones. Everyone who knows the protocol wants him either activated or destroyed.",
    conflictEngine:
      "Calder's refusal delays disaster and reveals the cost of obedience, but the longer he waits, the more the world proves why the failsafe was made."
  },
  {
    name: "Silas Merrow",
    archetype: "The Cartographer of Vanishing Roads",
    enneagram: "5w4",
    function:
      "Maps routes that appear only under emotional, ecological, or ritual conditions, preserving paths the world tries to erase.",
    coreDesire: "To understand where lost roads go and why they choose certain travelers.",
    coreFear: "That every map he finishes causes another place to vanish.",
    backstory:
      "Silas learned navigation from a parent who disappeared between milestones. His best maps are annotated with absences, wrong distances, and towns that remember him before he arrives.",
    conflictEngine:
      "Silas can guide others through impossible terrain, but each successful journey redraws the world and forces him to value people over perfect knowledge."
  },
  {
    name: "Ione Bell",
    archetype: "The Archivist of Incorrect Events",
    enneagram: "5w6",
    function:
      "Maintains records of events that did not happen, should not have happened, or happened only in discarded versions of the world.",
    coreDesire: "To protect evidence that reality is more fragile than authority admits.",
    coreFear: "That deleting an incorrect event will delete the people formed by it.",
    backstory:
      "Ione works in an archive where false records sometimes bleed into public life. She trusts catalog numbers more than memory until one impossible file names her as its author.",
    conflictEngine:
      "Ione's archive can prevent repetition, but preserving the wrong event may invite it back with sharper teeth and a claim on the present."
  },
  {
    name: "Rafe Lumen",
    archetype: "The Singer / Ritualist Who Makes Reality Repeat",
    enneagram: "3w4",
    function:
      "Uses performance, song, or ritual sequence to loop reality, restore a moment, or force a hidden pattern to reveal itself.",
    coreDesire: "To make one perfect repetition that repairs the loss beneath all his applause.",
    coreFear: "That without the ritual he is only an echo people will stop needing.",
    backstory:
      "Rafe became famous for ceremonies that made crowds remember the same dream. Privately, he repeats one night again and again, changing a note each time.",
    conflictEngine:
      "Rafe can make reality repeat, but each encore strengthens the wound he is trying to master and tempts others to mistake beauty for truth."
  },
  {
    name: "Alma Reed",
    archetype: "The Ecological Intermediary",
    enneagram: "2w1",
    function:
      "Translates between human need and nonhuman systems, negotiating with forests, machines, weather, spores, rivers, or posthuman bodies.",
    coreDesire: "To make mutual care possible across forms of life that do not share a language.",
    coreFear: "That every act of protection is secretly another form of extraction.",
    backstory:
      "Alma was marked by an ecosystem that saved her village and claimed her as its interpreter. She knows the living world is generous, but never sentimental.",
    conflictEngine:
      "Alma must broker survival between incompatible needs, and her kindness becomes dangerous when both sides ask her to choose what deserves to live."
  },
  {
    name: "Verity Cross",
    archetype: "The Mourner Who Cannot Let the Dead Stay Dead",
    enneagram: "4w5",
    function:
      "Keeps grief active enough to disturb boundaries between memory, body, archive, and afterlife.",
    coreDesire: "To make loss answer back without turning love into possession.",
    coreFear: "That acceptance is a second death she commits with her own hands.",
    backstory:
      "Verity learned a mourning practice that returns fragments of the dead in mirrors, letters, borrowed voices, and seasonal changes. Each return is less obedient than the last.",
    conflictEngine:
      "Verity can retrieve what others have buried, but every resurrection changes the living and asks whether grief is devotion or refusal."
  },
  {
    name: "Orin Graves",
    archetype: "The Repairer of Broken Worlds",
    enneagram: "8w9",
    function:
      "Confronts ruptured systems directly, taking responsibility for repair when institutions prefer managed decline.",
    coreDesire: "To protect the vulnerable by making damage visible and materially reversible.",
    coreFear: "That tenderness will slow him down until the world breaks beyond repair.",
    backstory:
      "Orin has rebuilt towns, bodies, and laws after disasters that official histories renamed as accidents. His hands know how many repairs are also confessions.",
    conflictEngine:
      "Orin can force a broken world to mend, but his strength becomes a threat when repair requires consent, patience, or admitting that some fractures became homes."
  }
] as const satisfies readonly CharacterArchetypePreset[];
