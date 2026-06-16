import { NextResponse } from "next/server";
import { CloudProjectPersistenceError, deleteCloudProject, getCloudProject, getCloudProjectConfigError } from "@/lib/cloud-project-persistence";

type RouteContext = { params: { id: string } };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: RouteContext) {
  const configError = getCloudProjectConfigError();
  if (configError) return cloudConfigErrorResponse("Cloud project load", "Cloud project persistence is not configured.");

  try {
    const project = await getCloudProject(params.id);
    if (!project) return NextResponse.json({ error: "Cloud project load failed because the selected project was not found.", action: "Cloud project load", diagnostic: "missing-project" }, { status: 404 });
    return NextResponse.json({ project });
  } catch (error) {
    return cloudPersistenceErrorResponse(error, "Cloud project load");
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const configError = getCloudProjectConfigError();
  if (configError) return cloudConfigErrorResponse("Cloud project delete", "Cloud project persistence is not configured.");

  try {
    await deleteCloudProject(params.id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return cloudPersistenceErrorResponse(error, "Cloud project delete");
  }
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
  const diagnostic = error instanceof CloudProjectPersistenceError ? "cloud-request-failed" : "cloud-unexpected-error";
  return NextResponse.json(
    {
      error: `${action} failed. Cloud persistence could not complete the request.`,
      action,
      diagnostic
    },
    { status: 502 }
  );
}
