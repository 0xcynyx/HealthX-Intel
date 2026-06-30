// Single source of truth for environment + constants. No hardcoded secrets,
// URLs, or thresholds elsewhere in the app (see CLAUDE.md §3).

export const env = {
  xConsumerKey: process.env.X_CONSUMER_KEY ?? '',
  xConsumerSecret: process.env.X_CONSUMER_SECRET ?? '',
  xBearerToken: process.env.X_BEARER_TOKEN ?? '',
  xTrendsWoeid: process.env.X_TRENDS_WOEID ?? '1',
  sallyMcpUrl: process.env.SALLY_MCP_URL ?? 'https://sally.a1c.io/mcp',
  sallyApiKey: process.env.SALLY_API_KEY ?? '',
  sallyTimezone: process.env.SALLY_TIMEZONE ?? 'UTC',
  syncIntervalMs: Number(process.env.SYNC_INTERVAL_MS ?? 300_000),
} as const;

export const X_API_BASE = 'https://api.x.com';

// Tunables — kept here so behaviour is config, not magic numbers in modules.
export const POSTS_PER_INFLUENCER = 10;
export const RECENT_SEARCH_MAX = 20;
export const WATCHLIST_COOKIE = 'hxi_watchlist';
export const MAX_WATCHLIST = 25;

export const hasX = (): boolean =>
  Boolean(env.xBearerToken || (env.xConsumerKey && env.xConsumerSecret));

export const hasSally = (): boolean => Boolean(env.sallyApiKey);
