import { NextResponse } from "next/server";
import { CloudReaderProfilePersistenceError, CloudReaderProfileStaleWriteError, deleteCloudReaderProfile, getCloudReaderProfile, getCloudReaderProfileConfigError, saveCloudReaderProfile } from "@/lib/cloud-reader-profile-persistence";
import { isCognitoAuthConfigured, requireAuthenticatedCognitoUser } from "@/lib/cognito-server-auth";
import { normalizeReaderProfile } from "@/lib/reader-profile";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authUser = await getRouteAuthUser(request);
  if (authUser instanceof NextResponse) return authUser;
  const profileId = resolveProfileId(request, authUser?.sub);
  if (!isValidProfileId(profileId)) return invalidProfileIdResponse();
  const configError = getCloudReaderProfileConfigError(authUser?.sub);
  if (configError) return cloudUnavailableResponse("Reader profile load");

  try {
    const profile = await getCloudReaderProfile(profileId, authUser?.sub);
    return NextResponse.json({ profileId, ownerId: authUser?.sub ?? "auth-disabled-fallback", profile, cloudProfileAvailable: true, cloudProfileExists: Boolean(profile), initializedDefaultCloudProfile: false, profileSource: authUser?.sub ? "authenticated cloud" : "auth-disabled fallback", diagnostic: routeDiagnostic(request, "Reader profile load", authUser?.sub, false) });
  } catch (error) {
    return cloudRequestErrorResponse(error, "Reader profile load", request, authUser?.sub, false);
  }
}

export async function PUT(request: Request) {
  const authUser = await getRouteAuthUser(request);
  if (authUser instanceof NextResponse) return authUser;
  const configError = getCloudReaderProfileConfigError(authUser?.sub);
  if (configError) return cloudUnavailableResponse("Reader profile save");

  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Reader profile save failed because the request was not valid JSON.", diagnostic: "invalid-request" }, { status: 400 }); }

  const profileId = authUser?.sub ? profileIdForCognitoSub(authUser.sub) : (typeof body === "object" && body ? (body as { profileId?: unknown }).profileId : null);
  if (!isValidProfileId(profileId)) return invalidProfileIdResponse();

  const profile = normalizeReaderProfile((body as { profile?: unknown }).profile);
  try {
    return NextResponse.json({ profileId, ownerId: authUser?.sub ?? "auth-disabled-fallback", profile: await saveCloudReaderProfile(profileId, profile, authUser?.sub), cloudProfileAvailable: true, cloudProfileExists: true, initializedDefaultCloudProfile: false, cloudProfileSaveStatus: "saved", profileSource: authUser?.sub ? "authenticated cloud" : "auth-disabled fallback", diagnostic: routeDiagnostic(request, "Reader profile save", authUser?.sub, false) });
  } catch (caughtError) {
    if (caughtError instanceof CloudReaderProfileStaleWriteError) {
      try {
        const latestProfile = await getCloudReaderProfile(profileId, authUser?.sub);
        return NextResponse.json({ profileId, ownerId: authUser?.sub ?? "auth-disabled-fallback", profile: latestProfile, cloudProfileAvailable: true, cloudProfileExists: Boolean(latestProfile), initializedDefaultCloudProfile: false, cloudProfileSaveStatus: "stale-write-ignored", diagnostic: { ...routeDiagnostic(request, "Reader profile save", authUser?.sub, false), result: "stale-cloud-write-ignored" }, profileSource: authUser?.sub ? "authenticated cloud" : "auth-disabled fallback" });
      } catch (error) { return cloudRequestErrorResponse(error, "Reader profile save", request, authUser?.sub, false); }
    }
    return cloudRequestErrorResponse(caughtError, "Reader profile save", request, authUser?.sub, false);
  }
}

export async function DELETE(request: Request) {
  const authUser = await getRouteAuthUser(request);
  if (authUser instanceof NextResponse) return authUser;
  const profileId = resolveProfileId(request, authUser?.sub);
  if (!isValidProfileId(profileId)) return invalidProfileIdResponse();
  const configError = getCloudReaderProfileConfigError(authUser?.sub);
  if (configError) return cloudUnavailableResponse("Reader profile delete");
  try { await deleteCloudReaderProfile(profileId, authUser?.sub); return NextResponse.json({ profileId, ownerId: authUser?.sub ?? "auth-disabled-fallback", deleted: true, diagnostic: routeDiagnostic(request, "Reader profile delete", authUser?.sub, false) }); } catch (error) { return cloudRequestErrorResponse(error, "Reader profile delete", request, authUser?.sub, false); }
}

async function getRouteAuthUser(request: Request) {
  if (!isCognitoAuthConfigured()) return null;
  const authUser = await requireAuthenticatedCognitoUser(request);
  if (!authUser) return NextResponse.json({ error: "Sign in is required for authenticated Reader Profile data.", diagnostic: "auth-required" }, { status: 401 });
  return authUser;
}

function resolveProfileId(request: Request, ownerId?: string): string | null { return ownerId ? profileIdForCognitoSub(ownerId) : new URL(request.url).searchParams.get("profileId"); }
function profileIdForCognitoSub(ownerId: string): string { return `reader-profile-${ownerId}`; }
function isValidProfileId(value: unknown): value is string { return typeof value === "string" && /^reader-profile-[A-Za-z0-9._:-]+$/.test(value) && value.length <= 160; }
function invalidProfileIdResponse() { return NextResponse.json({ error: "Reader profile request requires a valid authenticated owner or profileId.", diagnostic: "invalid-profile-id" }, { status: 400 }); }
function cloudUnavailableResponse(action: string) { return NextResponse.json({ error: "Reader profile cloud persistence is not configured.", action, diagnostic: "configuration-unavailable", cloudProfileAvailable: false }, { status: 503 }); }
function cloudRequestErrorResponse(error: unknown, action: string, request: Request, ownerId?: string, initializedDefaultCloudProfile = false) {
  const details = error instanceof CloudReaderProfilePersistenceError ? error.details : null;
  return NextResponse.json(
    {
      error: `${action} failed. Cloud persistence could not complete the request.`,
      action,
      diagnostic: {
        ...routeDiagnostic(request, action, ownerId, initializedDefaultCloudProfile),
        result: details ? "cloud-request-failed" : "cloud-unexpected-error",
        sanitizedErrorName: details?.awsErrorName ?? (error instanceof Error ? error.name : "UnknownError"),
        sanitizedErrorCode: details?.httpStatusCode ?? null,
        operation: details?.operation ?? "unknown"
      },
      cloudProfileAvailable: false,
      initializedDefaultCloudProfile
    },
    { status: 502 }
  );
}

function routeDiagnostic(request: Request, action: string, ownerId?: string, initializedDefaultCloudProfile = false) {
  return {
    apiPath: new URL(request.url).pathname,
    action,
    authTokenPresent: Boolean(request.headers.get("authorization")?.match(/^Bearer\s+.+/i)),
    resolvedOwnerId: ownerId ?? "auth-disabled-fallback",
    persistenceMode: ownerId ? "authenticated-owner-bridge" : "auth-disabled-fallback",
    initializedDefaultCloudProfile
  };
}
