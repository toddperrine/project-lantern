export const APP_VERSION = "0.7.0";

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
  const commitSha = valueOrFallback(process.env.VERCEL_GIT_COMMIT_SHA, "unknown");

  return {
    appVersion: APP_VERSION,
    buildEnvironment: valueOrFallback(process.env.VERCEL_ENV, "development"),
    gitBranch: valueOrFallback(process.env.VERCEL_GIT_COMMIT_REF, "local"),
    commitSha,
    shortCommitSha: commitSha === "unknown" ? "unknown" : commitSha.slice(0, 7),
    buildTimestamp: valueOrFallback(process.env.NEXT_PUBLIC_BUILD_TIMESTAMP, "unknown"),
    vercelUrl: valueOrFallback(process.env.VERCEL_URL, "local")
  };
}

function valueOrFallback(value: string | undefined, fallback: string): string {
  return value?.trim() || fallback;
}
