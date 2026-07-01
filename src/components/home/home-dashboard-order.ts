export const HOME_DASHBOARD_COLUMNS = [
  "continue-series",
  "start-something-new",
  "stories-waiting",
] as const;

export type HomeDashboardColumn = (typeof HOME_DASHBOARD_COLUMNS)[number];
