export const APP_VERSION = "0.7.79";

export type BuildInfo = {
  appVersion: string;
  buildEnvironment: string;
  gitBranch: string;
  commitSha: string;
  shortCommitSha: string;
  buildTimestamp: string;
  vercelUrl: string;
};

export function getBuildInfo(): BuildInfo {
  const buildEnvironment = firstEnvValue(["VERCEL_ENV", "NEXT_PUBLIC_VERCEL_ENV", "NEXT_PUBLIC_BUILD_ENV"], getDefaultBuildEnvironment());
  const gitBranch = firstEnvValue(["VERCEL_GIT_COMMIT_REF", "NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF", "NEXT_PUBLIC_GIT_BRANCH"], buildEnvironment === "production" ? "main" : "local");
  const commitSha = firstEnvValue(["VERCEL_GIT_COMMIT_SHA", "NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA", "NEXT_PUBLIC_COMMIT_SHA"], "unknown");

  return {
    appVersion: APP_VERSION,
    buildEnvironment,
    gitBranch,
    commitSha,
    shortCommitSha: commitSha === "unknown" ? "unknown" : commitSha.slice(0, 7),
    buildTimestamp: firstEnvValue(["NEXT_PUBLIC_BUILD_TIMESTAMP", "VERCEL_GIT_COMMIT_CREATED_AT"], "unknown"),
    vercelUrl: firstEnvValue(["VERCEL_PROJECT_PRODUCTION_URL", "VERCEL_BRANCH_URL", "VERCEL_URL", "NEXT_PUBLIC_VERCEL_URL"], "local")
  };
}

function firstEnvValue(names: string[], fallback: string): string {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }

  return fallback;
}

function getDefaultBuildEnvironment(): string {
  if (process.env.VERCEL_URL || process.env.NEXT_PUBLIC_VERCEL_URL) {
    return process.env.NODE_ENV === "production" ? "production" : "preview";
  }

  return process.env.NODE_ENV === "production" ? "production" : "development";
}
