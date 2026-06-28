import "server-only";

export type AuthenticatedCognitoUser = { sub: string; email: string };

const COGNITO_REGION = process.env.NEXT_PUBLIC_COGNITO_REGION ?? "";

export function isCognitoAuthConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID?.trim() && process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID?.trim() && COGNITO_REGION.trim());
}

export async function requireAuthenticatedCognitoUser(request: Request): Promise<AuthenticatedCognitoUser | null> {
  if (!isCognitoAuthConfigured()) return null;
  const token = readBearerToken(request.headers.get("authorization"));
  if (!token) return null;

  const response = await fetch(`https://cognito-idp.${COGNITO_REGION}.amazonaws.com/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-amz-json-1.1",
      "X-Amz-Target": "AWSCognitoIdentityProviderService.GetUser"
    },
    body: JSON.stringify({ AccessToken: token }),
    cache: "no-store"
  });

  if (!response.ok) return null;
  const payload = await response.json().catch(() => null) as { UserAttributes?: { Name?: string; Value?: string }[]; Username?: string } | null;
  const attributes = Array.isArray(payload?.UserAttributes) ? payload.UserAttributes : [];
  const sub = attributes.find((attribute) => attribute.Name === "sub")?.Value ?? "";
  const email = attributes.find((attribute) => attribute.Name === "email")?.Value ?? "";
  return sub ? { sub, email } : null;
}

function readBearerToken(value: string | null): string {
  const match = value?.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? "";
}
