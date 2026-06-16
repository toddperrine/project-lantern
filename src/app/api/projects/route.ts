import { NextResponse } from "next/server";
import { CloudProjectPersistenceError, getCloudProjectConfigError, listCloudProjects, saveCloudProject } from "@/lib/cloud-project-persistence";
import { isSavedProject } from "../../../lib/project-persistence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const configError = getCloudProjectConfigError();
  if (configError) return cloudConfigErrorResponse("Cloud project list", "Cloud project persistence is not configured.");

  try {
    const projects = await listCloudProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    return cloudPersistenceErrorResponse(error, "Cloud project list");
  }
}

export async function POST(request: Request) {
  const configError = getCloudProjectConfigError();
  if (configError) return cloudConfigErrorResponse("Cloud project save", "Cloud project persistence is not configured.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Cloud project save failed because the request was not valid JSON.", action: "Cloud project save", diagnostic: "invalid-request" }, { status: 400 });
  }

  const project = typeof body === "object" && body && "project" in body ? (body as { project?: unknown }).project : body;
  if (!isSavedProject(project)) {
    return NextResponse.json({ error: "Cloud project save failed because the request did not include a valid saved project.", action: "Cloud project save", diagnostic: "invalid-project" }, { status: 400 });
  }

  try {
    return NextResponse.json({ project: await saveCloudProject(project) }, { status: 201 });
  } catch (error) {
    return cloudPersistenceErrorResponse(error, "Cloud project save");
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
