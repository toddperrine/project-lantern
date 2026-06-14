import { NextResponse } from "next/server";
import {
  CloudSavedStoryPersistenceError,
  deleteCloudSavedStory,
  getCloudSavedStory,
  getCloudSavedStoryConfigError
} from "@/lib/cloud-saved-story-persistence";

type RouteContext = { params: { id: string; storyId: string } };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: RouteContext) {
  const configError = getCloudSavedStoryConfigError();
  if (configError) return cloudConfigErrorResponse(configError.missingVariables);

  try {
    const story = await getCloudSavedStory(params.id, params.storyId);
    if (!story) return NextResponse.json({ error: "Story not found." }, { status: 404 });
    return NextResponse.json({ story });
  } catch (error) {
    return cloudPersistenceErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const configError = getCloudSavedStoryConfigError();
  if (configError) return cloudConfigErrorResponse(configError.missingVariables);

  try {
    await deleteCloudSavedStory(params.id, params.storyId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return cloudPersistenceErrorResponse(error);
  }
}

function cloudConfigErrorResponse(missingVariables: string[]) {
  return NextResponse.json(
    {
      error: "Cloud saved story persistence is not configured.",
      missingVariables
    },
    { status: 503 }
  );
}

function cloudPersistenceErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Cloud saved story persistence request failed.";
  if (error instanceof CloudSavedStoryPersistenceError) {
    return NextResponse.json({ error: message, ...error.details }, { status: 502 });
  }
  return NextResponse.json({ error: message }, { status: 502 });
}
