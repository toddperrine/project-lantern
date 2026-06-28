"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AuthStatus = "signed_out" | "code_sent" | "signed_in" | "error";
export type CurrentUser = { id: string; email: string };

type TokenSet = { accessToken: string; idToken: string; refreshToken?: string; expiresAt: number };
type StoredSession = { currentUser: CurrentUser; tokens: TokenSet };
type AuthContextValue = {
  authConfigured: boolean;
  authStatus: AuthStatus;
  currentUser: CurrentUser | null;
  emailPendingVerification: string;
  errorMessage: string;
  region: string;
  profileLibraryMode: "anonymous" | "authenticated";
  sendCode: (email: string) => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  signOut: () => void;
};

type CognitoInitiateAuthResponse = { Session?: string; ChallengeName?: string; AuthenticationResult?: { AccessToken: string; IdToken: string; RefreshToken?: string; ExpiresIn?: number } };

type JwtPayload = { sub?: string; email?: string; username?: string; exp?: number };

const AUTH_SESSION_STORAGE_KEY = "projectLantern.auth.cognitoSession.v1";
const COGNITO_USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "";
const COGNITO_APP_CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID ?? "";
const COGNITO_REGION = process.env.NEXT_PUBLIC_COGNITO_REGION ?? "";
const AuthContext = createContext<AuthContextValue | null>(null);

function cognitoEndpoint(region: string) {
  return `https://cognito-idp.${region}.amazonaws.com/`;
}

async function callCognito<T>(target: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(cognitoEndpoint(COGNITO_REGION), {
    method: "POST",
    headers: { "Content-Type": "application/x-amz-json-1.1", "X-Amz-Target": `AWSCognitoIdentityProviderService.${target}` },
    body: JSON.stringify(body)
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(typeof payload.message === "string" ? payload.message : `Cognito ${target} failed.`);
  return payload as T;
}

function decodeJwt(token: string): JwtPayload {
  const [, payload] = token.split(".");
  if (!payload) return {};
  try {
    return JSON.parse(window.atob(payload.replace(/-/g, "+").replace(/_/g, "/"))) as JwtPayload;
  } catch {
    return {};
  }
}

function readStoredSession(): StoredSession | null {
  if (typeof window === "undefined") return null;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(AUTH_SESSION_STORAGE_KEY) ?? "null") as StoredSession | null;
    if (!parsed?.currentUser?.id || !parsed.currentUser.email || parsed.tokens.expiresAt <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const authConfigured = Boolean(COGNITO_USER_POOL_ID && COGNITO_APP_CLIENT_ID && COGNITO_REGION);
  const [authStatus, setAuthStatus] = useState<AuthStatus>("signed_out");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [emailPendingVerification, setEmailPendingVerification] = useState("");
  const [challengeSession, setChallengeSession] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const stored = readStoredSession();
    if (stored) {
      setCurrentUser(stored.currentUser);
      setAuthStatus("signed_in");
    }
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    setCurrentUser(null);
    setEmailPendingVerification("");
    setChallengeSession("");
    setErrorMessage("");
    setAuthStatus("signed_out");
  }, []);

  const sendCode = useCallback(async (email: string) => {
    if (!authConfigured) return;
    setErrorMessage("");
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const result = await callCognito<CognitoInitiateAuthResponse>("InitiateAuth", {
        AuthFlow: "CUSTOM_AUTH",
        ClientId: COGNITO_APP_CLIENT_ID,
        AuthParameters: { USERNAME: normalizedEmail },
        ClientMetadata: { auth_intent: "email_otp" }
      });
      setEmailPendingVerification(normalizedEmail);
      setChallengeSession(result.Session ?? "");
      setAuthStatus("code_sent");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to send Cognito email code.");
      setAuthStatus("error");
    }
  }, [authConfigured]);

  const verifyCode = useCallback(async (code: string) => {
    if (!authConfigured || !emailPendingVerification || !challengeSession) return;
    setErrorMessage("");
    try {
      const result = await callCognito<CognitoInitiateAuthResponse>("RespondToAuthChallenge", {
        ClientId: COGNITO_APP_CLIENT_ID,
        ChallengeName: "CUSTOM_CHALLENGE",
        Session: challengeSession,
        ChallengeResponses: { USERNAME: emailPendingVerification, ANSWER: code.trim() }
      });
      if (!result.AuthenticationResult?.IdToken || !result.AuthenticationResult.AccessToken) throw new Error("Cognito did not return an authenticated session.");
      const payload = decodeJwt(result.AuthenticationResult.IdToken);
      const currentUser = { id: payload.sub ?? emailPendingVerification, email: payload.email ?? emailPendingVerification };
      const expiresAt = payload.exp ? payload.exp * 1000 : Date.now() + (result.AuthenticationResult.ExpiresIn ?? 3600) * 1000;
      window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify({ currentUser, tokens: { accessToken: result.AuthenticationResult.AccessToken, idToken: result.AuthenticationResult.IdToken, refreshToken: result.AuthenticationResult.RefreshToken, expiresAt } } satisfies StoredSession));
      setCurrentUser(currentUser);
      setChallengeSession("");
      setAuthStatus("signed_in");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Unable to verify Cognito email code.");
      setAuthStatus("error");
    }
  }, [authConfigured, challengeSession, emailPendingVerification]);

  const value = useMemo<AuthContextValue>(() => ({ authConfigured, authStatus, currentUser, emailPendingVerification, errorMessage, region: COGNITO_REGION || "not configured", profileLibraryMode: currentUser ? "authenticated" : "anonymous", sendCode, signOut, verifyCode }), [authConfigured, authStatus, currentUser, emailPendingVerification, errorMessage, sendCode, signOut, verifyCode]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
