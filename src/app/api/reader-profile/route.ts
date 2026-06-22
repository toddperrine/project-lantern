import { NextResponse } from "next/server";
import { deleteCloudReaderProfile, getCloudReaderProfile, getCloudReaderProfileConfigError, saveCloudReaderProfile } from "@/lib/cloud-reader-profile-persistence";
import { normalizeReaderProfile } from "@/lib/reader-profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const profileId = getProfileIdFromUrl(request.url);
  if (!isValidProfileId(profileId)) return invalidProfileIdResponse();
  const configError = getCloudReaderProfileConfigError();
  if (configError) return cloudUnavailableResponse("Reader profile load");

  try {
    const profile = await getCloudReaderProfile(profileId);
    return NextResponse.json({ profileId, profile, cloudProfileAvailable: true });
  } catch {
    return cloudRequestErrorResponse("Reader profile load");
  }
}

export async function PUT(request: Request) {
  const configError = getCloudReaderProfileConfigError();
  if (configError) return cloudUnavailableResponse("Reader profile save");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Reader profile save failed because the request was not valid JSON.", diagnostic: "invalid-request" }, { status: 400 });
  }

  const profileId = typeof body === "object" && body ? (body as { profileId?: unknown }).profileId : null;
  if (!isValidProfileId(profileId)) return invalidProfileIdResponse();

  const profile = normalizeReaderProfile((body as { profile?: unknown }).profile);
  try {
    return NextResponse.json({ profileId, profile: await saveCloudReaderProfile(profileId, profile), cloudProfileAvailable: true });
  } catch {
    return cloudRequestErrorResponse("Reader profile save");
  }
}

export async function DELETE(request: Request) {
  const profileId = getProfileIdFromUrl(request.url);
  if (!isValidProfileId(profileId)) return invalidProfileIdResponse();
  const configError = getCloudReaderProfileConfigError();
  if (configError) return cloudUnavailableResponse("Reader profile delete");

  try {
    await deleteCloudReaderProfile(profileId);
    return NextResponse.json({ profileId, deleted: true });
  } catch {
    return cloudRequestErrorResponse("Reader profile delete");
  }
}

function getProfileIdFromUrl(url: string): string | null {
  return new URL(url).searchParams.get("profileId");
}

function isValidProfileId(value: unknown): value is string {
  return typeof value === "string" && /^reader-profile-[A-Za-z0-9._:-]+$/.test(value) && value.length <= 120;
}

function invalidProfileIdResponse() {
  return NextResponse.json({ error: "Reader profile request requires a valid profileId.", diagnostic: "invalid-profile-id" }, { status: 400 });
}

function cloudUnavailableResponse(action: string) {
  return NextResponse.json({ error: "Reader profile cloud persistence is not configured.", action, diagnostic: "configuration-unavailable", cloudProfileAvailable: false }, { status: 503 });
}

function cloudRequestErrorResponse(action: string) {
  return NextResponse.json({ error: `${action} failed. Cloud persistence could not complete the request.`, action, diagnostic: "cloud-request-failed", cloudProfileAvailable: false }, { status: 502 });
}
