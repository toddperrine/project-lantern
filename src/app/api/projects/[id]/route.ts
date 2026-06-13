import { NextResponse } from "next/server";
import { deleteCloudProject, getCloudProject, getCloudProjectConfigError } from "@/lib/cloud-project-persistence";

type RouteContext = { params: { id: string } };

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: Request, { params }: RouteContext) {
  const configError = getCloudProjectConfigError();
  if (configError) return cloudConfigErrorResponse(configError.missingVariables);

  try {
    const project = await getCloudProject(params.id);
    if (!project) return NextResponse.json({ error: "Project not found." }, { status: 404 });
    return NextResponse.json({ project });
  } catch (error) {
    return cloudPersistenceErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const configError = getCloudProjectConfigError();
  if (configError) return cloudConfigErrorResponse(configError.missingVariables);

  try {
    await deleteCloudProject(params.id);
    return NextResponse.json({ ok: true });
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
  return NextResponse.json({ error: message }, { status: 502 });
}
