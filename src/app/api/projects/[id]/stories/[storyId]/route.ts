import { NextResponse } from "next/server";
import {
  CloudSavedStoryPersistenceError,
  deleteCloudSavedStory,
  getCloudSavedStory,
  getCloudSavedStoryConfigError,
  isCloudSavedStoryCanonStatus,
  isCloudSavedStoryRole,
  updateCloudSavedStory,
  type CloudSavedStoryPatchInput
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

export async function PATCH(request: Request, { params }: RouteContext) {
  const configError = getCloudSavedStoryConfigError();
  if (configError) return cloudConfigErrorResponse(configError.missingVariables);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const storyPatch = parseCloudSavedStoryPatchInput(body);
  if (!storyPatch) {
    return NextResponse.json({ error: "Request body must include valid saved story metadata updates." }, { status: 400 });
  }

  try {
    const story = await updateCloudSavedStory(params.id, params.storyId, storyPatch);
    if (!story) return NextResponse.json({ error: "Story not found." }, { status: 404 });
    return NextResponse.json({ story });
  } catch (error) {
    return cloudPersistenceErrorResponse(error);
  }
}

function parseCloudSavedStoryPatchInput(body: unknown): CloudSavedStoryPatchInput | null {
  const candidate = typeof body === "object" && body && "story" in body ? (body as { story?: unknown }).story : body;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) return null;

  const value = candidate as Record<string, unknown>;
  const patch: CloudSavedStoryPatchInput = {};
  let updateCount = 0;

  for (const key of Object.keys(value)) {
    if (!isPatchField(key)) return null;
    updateCount += 1;
  }

  if (hasOwn(value, "title")) {
    if (typeof value.title !== "string" || !value.title.trim()) return null;
    patch.title = value.title;
  }
  if (hasOwn(value, "sequenceNumber")) {
    if (typeof value.sequenceNumber !== "number" || !Number.isFinite(value.sequenceNumber) || value.sequenceNumber <= 0) return null;
    patch.sequenceNumber = value.sequenceNumber;
  }
  if (hasOwn(value, "sequenceLabel")) {
    if (typeof value.sequenceLabel !== "string" || !value.sequenceLabel.trim()) return null;
    patch.sequenceLabel = value.sequenceLabel;
  }
  if (hasOwn(value, "storyRole")) {
    if (!isCloudSavedStoryRole(value.storyRole)) return null;
    patch.storyRole = value.storyRole;
  }
  if (hasOwn(value, "canonStatus")) {
    if (!isCloudSavedStoryCanonStatus(value.canonStatus)) return null;
    patch.canonStatus = value.canonStatus;
  }
  if (hasOwn(value, "isFavorite")) {
    if (typeof value.isFavorite !== "boolean") return null;
    patch.isFavorite = value.isFavorite;
  }
  if (hasOwn(value, "favoriteAt")) {
    if (value.favoriteAt !== null && (typeof value.favoriteAt !== "string" || !value.favoriteAt.trim())) return null;
    patch.favoriteAt = value.favoriteAt;
  }
  if (hasOwn(value, "continuationOfStoryId")) {
    if (value.continuationOfStoryId !== null && (typeof value.continuationOfStoryId !== "string" || !value.continuationOfStoryId.trim())) return null;
    patch.continuationOfStoryId = value.continuationOfStoryId;
  }
  if (hasOwn(value, "branchOfStoryId")) {
    if (value.branchOfStoryId !== null && (typeof value.branchOfStoryId !== "string" || !value.branchOfStoryId.trim())) return null;
    patch.branchOfStoryId = value.branchOfStoryId;
  }
  if (hasOwn(value, "lockedSettingsSnapshot")) {
    if (value.lockedSettingsSnapshot !== null && (!value.lockedSettingsSnapshot || typeof value.lockedSettingsSnapshot !== "object" || Array.isArray(value.lockedSettingsSnapshot))) return null;
    patch.lockedSettingsSnapshot = value.lockedSettingsSnapshot as Record<string, unknown> | null;
  }
  if (hasOwn(value, "continuationPrompt")) {
    if (value.continuationPrompt !== null && (typeof value.continuationPrompt !== "string" || !value.continuationPrompt.trim())) return null;
    patch.continuationPrompt = value.continuationPrompt;
  }

  return updateCount > 0 ? patch : null;
}

function isPatchField(value: string): value is keyof CloudSavedStoryPatchInput {
  return (
    value === "title" ||
    value === "sequenceNumber" ||
    value === "sequenceLabel" ||
    value === "storyRole" ||
    value === "canonStatus" ||
    value === "isFavorite" ||
    value === "favoriteAt" ||
    value === "continuationOfStoryId" ||
    value === "branchOfStoryId" ||
    value === "lockedSettingsSnapshot" ||
    value === "continuationPrompt"
  );
}

function hasOwn<T extends object>(value: T, key: PropertyKey): boolean {
  return Object.prototype.hasOwnProperty.call(value, key);
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
