"use client";

import { createContext, type ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type AuthStatus = "signed_out" | "signed_in" | "resetting_password" | "reset_code_sent" | "new_password_required" | "error";
export type CurrentUser = { id: string; email: string };

type TokenSet = { accessToken: string; idToken: string; refreshToken?: string; expiresAt: number };
type StoredSession = { currentUser: CurrentUser; tokens: TokenSet };
type AuthContextValue = {
  authConfigured: boolean;
  authSessionChecked: boolean;
  authStatus: AuthStatus;
  currentUser: CurrentUser | null;
  emailPendingVerification: string;
  resetEmail: string;
  errorMessage: string;
  successMessage: string;
  lastCognitoErrorCode: string;
  resetFlowState: string;
  region: string;
  profileLibraryMode: "anonymous" | "authenticated";
  authMode: "email_password";
  authFlow: "USER_PASSWORD_AUTH";
  lastAuthStep: string;
  appActionsGated: boolean;
  getAccessToken: () => string;
  signIn: (email: string, password: string) => Promise<void>;
  beginPasswordReset: (email: string) => Promise<void>;
  confirmPasswordReset: (code: string, newPassword: string) => Promise<void>;
  completeNewPassword: (newPassword: string) => Promise<void>;
  signOut: () => void;
};

type CognitoInitiateAuthResponse = { Session?: string; ChallengeName?: string; ChallengeParameters?: Record<string, string>; AuthenticationResult?: { AccessToken: string; IdToken: string; RefreshToken?: string; ExpiresIn?: number } };

type JwtPayload = { sub?: string; email?: string; username?: string; exp?: number };

const AUTH_SESSION_STORAGE_KEY = "projectLantern.auth.cognitoSession.v1";
const COGNITO_USER_POOL_ID = process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID ?? "";
const COGNITO_APP_CLIENT_ID = process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID ?? "";
const COGNITO_REGION = process.env.NEXT_PUBLIC_COGNITO_REGION ?? "";
const AUTH_FLOW = "USER_PASSWORD_AUTH" as const;
const AUTH_MODE = "email_password" as const;
const INVITE_ONLY_ERROR = "This private alpha is invite-only. Use an approved email address.";
const INCORRECT_PASSWORD_ERROR = "Incorrect email or password.";
const PASSWORD_SET_SUCCESS = "Password set. Sign in with your new password.";
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
  if (!response.ok) {
    const message = typeof payload.message === "string" ? payload.message : `Cognito ${target} failed.`;
    const code = typeof payload.__type === "string" ? payload.__type.split("#").pop() : typeof payload.name === "string" ? payload.name : "";
    throw new CognitoError(message, code);
  }
  return payload as T;
}

class CognitoError extends Error {
  constructor(message: string, readonly code: string) {
    super(code ? `${code}: ${message}` : message);
    this.name = "CognitoError";
  }
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


function cognitoErrorCode(error: unknown) {
  if (error instanceof CognitoError) return error.code;
  const message = error instanceof Error ? error.message : String(error);
  return message.match(/([A-Za-z]+Exception)/)?.[1] ?? "";
}

function isInviteOnlyError(error: unknown) {
  const code = cognitoErrorCode(error);
  const message = error instanceof Error ? error.message : String(error);
  return code === "UserNotFoundException" || /sign.?up.*disabled|not.?approved|user.*not.*exist|user.*not.*found|cannot be found/i.test(message);
}

function isPasswordResetRequired(error: unknown) {
  return cognitoErrorCode(error) === "PasswordResetRequiredException";
}

function authErrorMessage(error: unknown, fallback: string) {
  const code = cognitoErrorCode(error);
  if (isInviteOnlyError(error)) return INVITE_ONLY_ERROR;
  if (code === "NotAuthorizedException") return INCORRECT_PASSWORD_ERROR;
  if (code === "CodeMismatchException" || code === "ExpiredCodeException") return "The reset code is incorrect or expired.";
  return error instanceof Error ? error.message.replace(/^\w+Exception: /, "") : fallback;
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
  const [authSessionChecked, setAuthSessionChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [emailPendingVerification, setEmailPendingVerification] = useState("");
  const [resetEmail, setResetEmail] = useState("");
  const [challengeSession, setChallengeSession] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [lastCognitoErrorCode, setLastCognitoErrorCode] = useState("none");
  const [resetFlowState, setResetFlowState] = useState("idle");
  const [lastAuthStep, setLastAuthStep] = useState("not_started");

  useEffect(() => {
    const stored = readStoredSession();
    if (stored) {
      setCurrentUser(stored.currentUser);
      setAuthStatus("signed_in");
      setLastAuthStep("stored_session_restored");
    }
    setAuthSessionChecked(true);
  }, []);

  const clearMessages = useCallback(() => {
    setErrorMessage("");
    setSuccessMessage("");
    setLastCognitoErrorCode("none");
  }, []);

  const recordError = useCallback((error: unknown, fallback: string) => {
    setLastCognitoErrorCode(cognitoErrorCode(error) || "unknown");
    setErrorMessage(authErrorMessage(error, fallback));
  }, []);

  const storeSession = useCallback((result: NonNullable<CognitoInitiateAuthResponse["AuthenticationResult"]>, fallbackEmail: string) => {
    if (!result.IdToken || !result.AccessToken) throw new Error("Cognito did not return an authenticated session.");
    const payload = decodeJwt(result.IdToken);
    const currentUser = { id: payload.sub ?? fallbackEmail, email: payload.email ?? fallbackEmail };
    const expiresAt = payload.exp ? payload.exp * 1000 : Date.now() + (result.ExpiresIn ?? 3600) * 1000;
    window.localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify({ currentUser, tokens: { accessToken: result.AccessToken, idToken: result.IdToken, refreshToken: result.RefreshToken, expiresAt } } satisfies StoredSession));
    setCurrentUser(currentUser);
    setChallengeSession("");
    setResetEmail("");
    setResetFlowState("idle");
    setEmailPendingVerification("");
    setAuthStatus("signed_in");
  }, []);

  const signOut = useCallback(() => {
    window.localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    setCurrentUser(null);
    setEmailPendingVerification("");
    setResetEmail("");
    setChallengeSession("");
    clearMessages();
    setResetFlowState("idle");
    setAuthStatus("signed_out");
    setLastAuthStep("signed_out");
  }, [clearMessages]);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!authConfigured) return;
    clearMessages();
    const normalizedEmail = email.trim().toLowerCase();
    try {
      const result = await callCognito<CognitoInitiateAuthResponse>("InitiateAuth", { AuthFlow: AUTH_FLOW, ClientId: COGNITO_APP_CLIENT_ID, AuthParameters: { USERNAME: normalizedEmail, PASSWORD: password } });
      setEmailPendingVerification(normalizedEmail);
      if (result.ChallengeName === "NEW_PASSWORD_REQUIRED") {
        setChallengeSession(result.Session ?? "");
        setLastAuthStep("NEW_PASSWORD_REQUIRED");
        setAuthStatus("new_password_required");
        return;
      }
      if (!result.AuthenticationResult) throw new Error("Cognito did not return an authenticated session.");
      storeSession(result.AuthenticationResult, normalizedEmail);
      setLastAuthStep("signed_in");
    } catch (error) {
      if (isPasswordResetRequired(error)) {
        setResetEmail(normalizedEmail);
        setLastCognitoErrorCode(cognitoErrorCode(error) || "PasswordResetRequiredException");
        setResetFlowState("password_reset_required");
        setAuthStatus("resetting_password");
        setLastAuthStep("password_reset_required");
        return;
      }
      recordError(error, "Unable to sign in.");
      setLastAuthStep("sign_in_error");
      setAuthStatus("error");
    }
  }, [authConfigured, clearMessages, recordError, storeSession]);

  const beginPasswordReset = useCallback(async (email: string) => {
    if (!authConfigured) return;
    clearMessages();
    const normalizedEmail = email.trim().toLowerCase();
    setResetEmail(normalizedEmail);
    setAuthStatus("resetting_password");
    setResetFlowState("collecting_email");
    if (!normalizedEmail) {
      setLastAuthStep("password_reset_started");
      return;
    }
    try {
      await callCognito("ForgotPassword", { ClientId: COGNITO_APP_CLIENT_ID, Username: normalizedEmail });
      setLastAuthStep("reset_code_sent");
      setResetFlowState("reset_code_sent");
      setAuthStatus("reset_code_sent");
    } catch (error) {
      recordError(error, "Unable to request a password reset code.");
      setLastAuthStep("reset_request_error");
      setResetFlowState("request_error");
      setAuthStatus("error");
    }
  }, [authConfigured, clearMessages, recordError]);

  const confirmPasswordReset = useCallback(async (code: string, newPassword: string) => {
    if (!authConfigured || !resetEmail) return;
    clearMessages();
    try {
      await callCognito("ConfirmForgotPassword", { ClientId: COGNITO_APP_CLIENT_ID, Username: resetEmail, ConfirmationCode: code.trim(), Password: newPassword });
      setSuccessMessage(PASSWORD_SET_SUCCESS);
      setResetFlowState("password_reset_confirmed");
      setLastAuthStep("password_reset_confirmed");
      setAuthStatus("signed_out");
    } catch (error) {
      recordError(error, "Unable to set the new password.");
      setLastAuthStep("reset_confirm_error");
      setResetFlowState("confirm_error");
      setAuthStatus("reset_code_sent");
    }
  }, [authConfigured, clearMessages, recordError, resetEmail]);

  const completeNewPassword = useCallback(async (newPassword: string) => {
    if (!authConfigured || !emailPendingVerification || !challengeSession) return;
    clearMessages();
    try {
      const result = await callCognito<CognitoInitiateAuthResponse>("RespondToAuthChallenge", { ClientId: COGNITO_APP_CLIENT_ID, ChallengeName: "NEW_PASSWORD_REQUIRED", Session: challengeSession, ChallengeResponses: { USERNAME: emailPendingVerification, NEW_PASSWORD: newPassword } });
      if (!result.AuthenticationResult) throw new Error("Cognito did not return an authenticated session.");
      storeSession(result.AuthenticationResult, emailPendingVerification);
      setLastAuthStep("new_password_completed");
    } catch (error) {
      recordError(error, "Unable to set the new password.");
      setLastAuthStep("new_password_error");
      setAuthStatus("new_password_required");
    }
  }, [authConfigured, challengeSession, clearMessages, emailPendingVerification, recordError, storeSession]);

  const getAccessToken = useCallback(() => readStoredSession()?.tokens.accessToken ?? "", []);

  const value = useMemo<AuthContextValue>(() => ({ authConfigured, authSessionChecked, authStatus, currentUser, emailPendingVerification, resetEmail, errorMessage, successMessage, lastCognitoErrorCode, resetFlowState, region: COGNITO_REGION || "not configured", profileLibraryMode: currentUser ? "authenticated" : "anonymous", authMode: AUTH_MODE, authFlow: AUTH_FLOW, lastAuthStep, appActionsGated: authConfigured && !currentUser, getAccessToken, signIn, beginPasswordReset, confirmPasswordReset, completeNewPassword, signOut }), [authConfigured, authSessionChecked, authStatus, currentUser, emailPendingVerification, resetEmail, errorMessage, successMessage, lastCognitoErrorCode, resetFlowState, lastAuthStep, getAccessToken, signIn, beginPasswordReset, confirmPasswordReset, completeNewPassword, signOut]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider.");
  return value;
}
