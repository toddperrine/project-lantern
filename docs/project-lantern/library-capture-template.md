# First-Party Library Capture Template

Use this template to normalize spoken notes, workshop notes, and raw internal ideas into reusable Project Lantern first-party assets. These templates are for company-owned content only and do not add UI, persistence, model routing, or story-generation behavior.

## IP Metadata Defaults

Every captured asset should use these defaults unless a future rights workflow explicitly replaces them:

- `source`: Project Lantern First-Party Library
- `createdBy`: Project Lantern
- `ipOwner`: Project Lantern
- `ipStatus`: first-party
- `usageRights`: Company-owned content for Project Lantern product use.

## Shared Required Fields

- `id`: Stable kebab-case asset id with an asset-type prefix.
- `title`: Short display name for the reusable asset.
- `description`: One concise sentence that preserves the asset's story value.
- `tags`: Search and matching tags using existing tone, mood, and story-purpose language.

## Shared Optional Fields

- `sourceNote`: Original spoken, raw, or workshop note before normalization.
- `audienceFit`: Reader-facing fit notes such as cozy, eerie, high-action, reflective, or younger-reader friendly.
- `continuityNotes`: Constraints that help future Living Series uses stay consistent.
- `avoid`: Specific details, tones, or implications that should not be used with this asset.

## Character

Required fields:

- Shared required fields.
- `role`: The character's reusable story function, such as lead, ally, rival, mentor, or mystery figure.
- `definingTrait`: The memorable behavior, wound, want, or contradiction that makes the character recognizable.

Optional fields:

- Shared optional fields.
- `relationships`: Important bonds, tensions, or recurring dynamics with other assets.
- `visualCue`: A simple recognizable detail that can anchor future presentation or generation.

Normalization example:

Raw note: "Kid courier, talks too much when nervous, always takes the weird shortcut."

Structured asset:

```json
{
  "title": "Nervous Shortcut Courier",
  "description": "A fast-talking courier whose nerves send them through impossible routes that often reveal the truth first.",
  "tags": ["adventurous", "funny", "clues", "motion", "choice"]
}
```

## World

Required fields:

- Shared required fields.
- `coreRule`: The simple rule, premise, or recurring pressure that makes the world behave differently.
- `readerPromise`: The experience this world reliably offers, such as wonder, suspense, comfort, or discovery.

Optional fields:

- Shared optional fields.
- `recurringPlaces`: Locations that naturally belong inside this world.
- `socialTexture`: How people live, trade, gather, celebrate, or keep secrets here.

Normalization example:

Raw note: "Town where every porch light answers another one after midnight, maybe like a code."

Structured asset:

```json
{
  "title": "The Answering Lights",
  "description": "A quiet town where porch lights blink messages after midnight and residents pretend not to understand them.",
  "tags": ["mysterious", "cozy", "secrets", "community", "signals"]
}
```

## Location

Required fields:

- Shared required fields.
- `settingFunction`: What this place does for a story, such as threshold, refuge, reveal point, test, or return path.
- `sensoryAnchor`: One concrete sound, image, texture, or ritual that makes the place easy to recall.

Optional fields:

- Shared optional fields.
- `connectedWorld`: World asset id or title this location naturally belongs to.
- `secret`: A hidden fact or unresolved question that can drive future episodes.

Normalization example:

Raw note: "Tiny observatory over a tea shop, steam shows tomorrow's weather but only for one person."

Structured asset:

```json
{
  "title": "Teashop Observatory",
  "description": "A rooftop observatory where tea steam reveals one visitor's personal weather for the day ahead.",
  "tags": ["relaxing", "thoughtful", "wonder", "cozy", "forecast"]
}
```

## Story Spark

Required fields:

- Shared required fields.
- `incitingChange`: The event, arrival, discovery, loss, invitation, or warning that starts motion.
- `choicePressure`: The decision or emotional pressure the reader should feel through the premise.

Optional fields:

- Shared optional fields.
- `twistDirection`: A soft hint for how the spark might deepen without prescribing a full plot.
- `bestFitAssets`: Character, world, location, theme, or series seed ids this spark pairs well with.

Normalization example:

Raw note: "Message shows up a day early and says don't trust the obvious answer."

Structured asset:

```json
{
  "title": "The Early Warning",
  "description": "A message arrives one day before it was written, warning the hero away from the answer everyone else accepts.",
  "tags": ["mysterious", "clue", "choice", "time", "revelation"]
}
```

## Theme

Required fields:

- Shared required fields.
- `emotionalQuestion`: The human question the theme keeps returning to.
- `storyExpression`: How the theme should show up through choices, relationships, or consequences.

Optional fields:

- Shared optional fields.
- `counterpoint`: The opposing belief, fear, or temptation that makes the theme active.
- `toneFit`: Tones where this theme works especially well or poorly.

Normalization example:

Raw note: "Small brave things, not big speeches. Choosing again when scared."

Structured asset:

```json
{
  "title": "Courage in Small Steps",
  "description": "Bravery grows through ordinary repeatable choices rather than grand declarations.",
  "tags": ["thoughtful", "adventurous", "growth", "courage", "choice"]
}
```

## Series Seed

Required fields:

- Shared required fields.
- `seriesPromise`: The repeatable reason a reader would return for another episode.
- `continuationEngine`: The mystery, journey, relationship, job, place, or ritual that can produce multiple episodes.

Optional fields:

- Shared optional fields.
- `starterCast`: Suggested character roles or existing character ids for the first version of the series.
- `episodePattern`: The natural rhythm of installments, such as case-of-the-week, journey stop, seasonal reveal, or cozy ritual.

Normalization example:

Raw note: "Every week they repair a strange little machine and learn who it belonged to."

Structured asset:

```json
{
  "title": "The Memory Repair Shop",
  "description": "A gentle ongoing series about repairing impossible machines and uncovering the lives they quietly protected.",
  "tags": ["relaxing", "emotional", "wonder", "memory", "episodic"]
}
```

## Craft Rule

Required fields:

- Shared required fields.
- `rule`: A clear reusable storytelling constraint or preference.
- `readerBenefit`: Why the rule improves the reader's experience.

Optional fields:

- Shared optional fields.
- `appliesTo`: Asset types, tones, series patterns, or episode moments where the rule is most useful.
- `exampleUse`: A short demonstration of the rule in practice.

Normalization example:

Raw note: "Don't explain the weird thing right away; let one normal detail make it feel real first."

Structured asset:

```json
{
  "title": "Ground Wonder Before Explaining It",
  "description": "Introduce a strange element through one ordinary detail before naming how it works.",
  "tags": ["craft", "wonder", "clarity", "immersion", "pacing"]
}
```
