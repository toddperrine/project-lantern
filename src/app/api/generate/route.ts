import { NextResponse } from 'next/server';
import { generateStory } from '@/lib/storyGenerator';
import type { StoryGenerationRequest } from '@/types/story';

const MAX_TEXT_LENGTH = 80_000;

function isValidPayload(payload: unknown): payload is StoryGenerationRequest {
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const candidate = payload as Partial<StoryGenerationRequest>;
  return (
    typeof candidate.worldBible === 'string' &&
    typeof candidate.characterProfiles === 'string' &&
    typeof candidate.storySeed === 'string'
  );
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null);

  if (!isValidPayload(payload)) {
    return NextResponse.json({ error: 'World bible, character profiles, and story seed are required.' }, { status: 400 });
  }

  if (!payload.worldBible.trim() || !payload.characterProfiles.trim() || !payload.storySeed.trim()) {
    return NextResponse.json({ error: 'Please upload both files and enter a story seed before generating.' }, { status: 400 });
  }

  if (payload.worldBible.length > MAX_TEXT_LENGTH || payload.characterProfiles.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: 'Uploaded files are too large for the local MVP limit.' }, { status: 413 });
  }

  return NextResponse.json(generateStory(payload));
}
