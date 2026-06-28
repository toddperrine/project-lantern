import { NextResponse } from "next/server";
import { isCognitoAuthConfigured, requireAuthenticatedCognitoUser } from "@/lib/cognito-server-auth";
import {
  CloudSavedStoryPersistenceError,
  getCloudSavedStoryConfigError,
  isCloudSavedStoryCanonStatus,
  isCloudSavedStoryRole,
  listCloudSavedStories,
  saveCloudSavedStory,
  type CloudSavedStoryInput
} from "@/lib/cloud-saved-story-persistence";

type RouteContext = { params: { id: string } };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: RouteContext) {
  const authUser = await getRouteAuthUser(request);
  if (authUser instanceof NextResponse) return authUser;
  const configError = getCloudSavedStoryConfigError(authUser?.sub);
  if (configError) return cloudConfigErrorResponse("Cloud story list", "Cloud saved story persistence is not configured.");

  try {
    const stories = await listCloudSavedStories(params.id, authUser?.sub);
    if (!stories) return NextResponse.json({ error: "Cloud story list failed because the selected project was not found.", action: "Cloud story list", diagnostic: "missing-project" }, { status: 404 });
    return NextResponse.json({ stories });
  } catch (error) {
    return cloudPersistenceErrorResponse(error, "Cloud story list");
  }
}

export async function POST(request: Request, { params }: RouteContext) {
  const authUser = await getRouteAuthUser(request);
  if (authUser instanceof NextResponse) return authUser;
  const configError = getCloudSavedStoryConfigError(authUser?.sub);
  if (configError) return cloudConfigErrorResponse("Cloud story save", "Cloud saved story persistence is not configured.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cloud story save failed because the request was not valid JSON.", action: "Cloud story save", diagnostic: "invalid-request" }, { status: 400 });
  }

  const storyInput = parseCloudSavedStoryInput(body);
  if (!storyInput) {
    return NextResponse.json({ error: "Cloud story save failed because the request did not include a valid saved story.", action: "Cloud story save", diagnostic: "invalid-story" }, { status: 400 });
  }

  try {
    const story = await saveCloudSavedStory(params.id, storyInput, authUser?.sub);
    if (!story) return NextResponse.json({ error: "Cloud story save failed because the selected project was not found.", action: "Cloud story save", diagnostic: "missing-project" }, { status: 404 });
    return NextResponse.json({ story }, { status: 201 });
  } catch (error) {
    return cloudPersistenceErrorResponse(error, "Cloud story save");
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
  if (value.canonStatus !== undefined && !isCloudSavedStoryCanonStatus(value.canonStatus)) return null;
  if (value.isFavorite !== undefined && typeof value.isFavorite !== "boolean") return null;
  if (value.favoriteAt !== undefined && value.favoriteAt !== null && (typeof value.favoriteAt !== "string" || !value.favoriteAt.trim())) return null;
  if (value.continuationOfStoryId !== undefined && (typeof value.continuationOfStoryId !== "string" || !value.continuationOfStoryId.trim())) return null;
  if (value.branchOfStoryId !== undefined && (typeof value.branchOfStoryId !== "string" || !value.branchOfStoryId.trim())) return null;
  if (value.lockedSettingsSnapshot !== undefined && value.lockedSettingsSnapshot !== null && (!value.lockedSettingsSnapshot || typeof value.lockedSettingsSnapshot !== "object" || Array.isArray(value.lockedSettingsSnapshot))) return null;
  if (value.continuationPrompt !== undefined && value.continuationPrompt !== null && (typeof value.continuationPrompt !== "string" || !value.continuationPrompt.trim())) return null;
  if (value.metadata !== undefined && (!value.metadata || typeof value.metadata !== "object" || Array.isArray(value.metadata))) return null;

  return {
    storyId: value.storyId,
    title: value.title,
    story: value.story,
    metadata: value.metadata as Record<string, unknown> | undefined,
    sequenceNumber: value.sequenceNumber,
    sequenceLabel: value.sequenceLabel,
    storyRole: value.storyRole,
    canonStatus: value.canonStatus,
    isFavorite: value.isFavorite,
    favoriteAt: value.favoriteAt,
    continuationOfStoryId: value.continuationOfStoryId,
    branchOfStoryId: value.branchOfStoryId,
    lockedSettingsSnapshot: value.lockedSettingsSnapshot as Record<string, unknown> | null | undefined,
    continuationPrompt: value.continuationPrompt
  };
}

function cloudConfigErrorResponse(action: string, error: string) {
  return NextResponse.json(
    {
      error,
      action,
      diagnostic: "configuration-unavailable"
    },
    { status: 503 }
  );
}

function cloudPersistenceErrorResponse(error: unknown, action: string) {
  const diagnostic = error instanceof CloudSavedStoryPersistenceError ? "cloud-request-failed" : "cloud-unexpected-error";
  return NextResponse.json(
    {
      error: `${action} failed. Cloud persistence could not complete the request.`,
      action,
      diagnostic
    },
    { status: 502 }
  );
}

async function getRouteAuthUser(request: Request) {
  if (!isCognitoAuthConfigured()) return null;
  const authUser = await requireAuthenticatedCognitoUser(request);
  if (!authUser) return NextResponse.json({ error: "Sign in is required for authenticated Story Library data.", diagnostic: "auth-required" }, { status: 401 });
  return authUser;
}
