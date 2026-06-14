import { NextResponse } from "next/server";
import {
  CloudSavedStoryPersistenceError,
  getCloudSavedStoryConfigError,
  isCloudSavedStoryRole,
  listCloudSavedStories,
  saveCloudSavedStory,
  type CloudSavedStoryInput
} from "@/lib/cloud-saved-story-persistence";

type RouteContext = { params: { id: string } };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: RouteContext) {
  const configError = getCloudSavedStoryConfigError();
  if (configError) return cloudConfigErrorResponse(configError.missingVariables);

  try {
    const stories = await listCloudSavedStories(params.id);
    if (!stories) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    return NextResponse.json({ stories });
  } catch (error) {
    return cloudPersistenceErrorResponse(error);
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const configError = getCloudSavedStoryConfigError();
  if (configError) return cloudConfigErrorResponse(configError.missingVariables);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const storyInput = parseCloudSavedStoryInput(body);
  if (!storyInput) {
    return NextResponse.json({ error: "Request body must include a valid saved story." }, { status: 400 });
  }

  try {
    const story = await saveCloudSavedStory(params.id, storyInput);
    if (!story) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    return NextResponse.json({ story }, { status: 201 });
  } catch (error) {
    return cloudPersistenceErrorResponse(error);
  }
}

function parseCloudSavedStoryInput(body: unknown): CloudSavedStoryInput | null {
  const candidate = typeof body === "object" && body && "story" in body && typeof (body as { story?: unknown }).story !== "string" ? (body as { story?: unknown }).story : body;
  if (!candidate || typeof candidate !== "object") return null;

  const value = candidate as Record<string, unknown>;
  if (typeof value.title !== "string" || !value.title.trim()) return null;
  if (typeof value.story !== "string" || !value.story.trim()) return null;
  if (value.storyId !== undefined && (typeof value.storyId !== "string" || !value.storyId.trim())) return null;
  if (value.sequenceNumber !== undefined && (typeof value.sequenceNumber !== "number" || !Number.isFinite(value.sequenceNumber) || value.sequenceNumber <= 0)) return null;
  if (value.sequenceLabel !== undefined && (typeof value.sequenceLabel !== "string" || !value.sequenceLabel.trim())) return null;
  if (value.storyRole !== undefined && !isCloudSavedStoryRole(value.storyRole)) return null;
  if (value.continuationOfStoryId !== undefined && (typeof value.continuationOfStoryId !== "string" || !value.continuationOfStoryId.trim())) return null;
  if (value.metadata !== undefined && (!value.metadata || typeof value.metadata !== "object" || Array.isArray(value.metadata))) return null;

  return {
    storyId: value.storyId,
    title: value.title,
    story: value.story,
    metadata: value.metadata as Record<string, unknown> | undefined,
    sequenceNumber: value.sequenceNumber,
    sequenceLabel: value.sequenceLabel,
    storyRole: value.storyRole,
    continuationOfStoryId: value.continuationOfStoryId
  };
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
