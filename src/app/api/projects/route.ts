import { NextResponse } from "next/server";
import { CloudProjectPersistenceError, getCloudProjectConfigError, listCloudProjects, saveCloudProject } from "@/lib/cloud-project-persistence";
import { isSavedProject } from "../../../lib/project-persistence";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const configError = getCloudProjectConfigError();
  if (configError) return cloudConfigErrorResponse(configError.missingVariables);

  try {
    const projects = await listCloudProjects();
    return NextResponse.json({ projects });
  } catch (error) {
    return cloudPersistenceErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const configError = getCloudProjectConfigError();
  if (configError) return cloudConfigErrorResponse(configError.missingVariables);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const project = typeof body === "object" && body && "project" in body ? (body as { project?: unknown }).project : body;
  if (!isSavedProject(project)) {
    return NextResponse.json({ error: "Request body must include a valid saved project." }, { status: 400 });
  }

  try {
    return NextResponse.json({ project: await saveCloudProject(project) }, { status: 201 });
  } catch (error) {
    return cloudPersistenceErrorResponse(error);
  }
}

function cloudConfigErrorResponse(missingVariables: string[]) {
  return NextResponse.json(
    {
      error: "Cloud project persistence is not configured.",
      missingVariables
    },
    { status: 503 }
  );
}

function cloudPersistenceErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Cloud project persistence request failed.";
  if (error instanceof CloudProjectPersistenceError) {
    return NextResponse.json({ error: message, ...error.details }, { status: 502 });
  }
  return NextResponse.json({ error: message }, { status: 502 });
}
