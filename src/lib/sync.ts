// Orchestration: compose live X + Sally into one Overview, degrade gracefully
// to seed when a source is unconfigured or failing, and cache for SYNC_INTERVAL_MS.
import 'server-only';
import { hasSally, hasX } from './config';
import { buildInfluencerAnalysis, buildRiskAlert, RISK_QUERIES } from './analyze';
import { buildSallySnapshot } from './sally';
import { getTrends, getUsersByUsernames, getUserTweets, searchRecent } from './x';
import { getCache, setCache } from './cache';
import { SEED_HISTORY, SEED_SALLY, SEED_TRENDS, seedOverview } from './seed';
import type {
  Influencer,
  InfluencerAnalysis,
  Overview,
  RiskAlert,
  SallySnapshot,
  TrendItem,
  XPost,
  XUser,
} from './types';

function cacheKey(watchlist: Influencer[]): string {
  return 'overview:' + watchlist.map((i) => i.handle.toLowerCase()).sort().join(',');
}

async function liveSally(): Promise<SallySnapshot> {
  if (!hasSally()) return SEED_SALLY;
  try {
    return await buildSallySnapshot('auto');
  } catch {
    return { ...SEED_SALLY, note: 'Sally call failed — showing last seeded snapshot.' };
  }
}

async function liveInfluencers(watchlist: Influencer[], weakAreas: string[]): Promise<InfluencerAnalysis[]> {
  if (!hasX()) {
    return watchlist.map((inf) => buildInfluencerAnalysis(inf, null, [], weakAreas, 'seed'));
  }
  let users: XUser[] = [];
  try {
    users = await getUsersByUsernames(watchlist.map((i) => i.handle));
  } catch {
    /* leave users empty; per-influencer fallback handles it */
  }
  const byHandle = new Map(users.map((u) => [u.username.toLowerCase(), u]));

  return Promise.all(
    watchlist.map(async (inf) => {
      const user = byHandle.get(inf.handle.toLowerCase()) ?? null;
      let posts: XPost[] = [];
      let source: 'live' | 'seed' = user ? 'live' : 'seed';
      if (user) {
        try {
          posts = await getUserTweets(user.id);
        } catch {
          source = 'seed';
        }
      }
      return buildInfluencerAnalysis(inf, user, posts, weakAreas, source);
    }),
  );
}

async function liveRisks(weakAreas: string[]): Promise<RiskAlert[]> {
  if (!hasX()) return [];
  const settled = await Promise.allSettled(
    RISK_QUERIES.map(async (q) => buildRiskAlert(q.query, q.label, await searchRecent(q.query), weakAreas)),
  );
  const alerts: RiskAlert[] = [];
  for (const s of settled) if (s.status === 'fulfilled' && s.value) alerts.push(s.value);
  const rank: Record<RiskAlert['severity'], number> = { high: 0, medium: 1, low: 2 };
  alerts.sort((a, b) => rank[a.severity] - rank[b.severity]);
  return alerts;
}

async function liveTrends(): Promise<TrendItem[]> {
  if (!hasX()) return SEED_TRENDS;
  try {
    return (await getTrends()).slice(0, 12);
  } catch {
    return SEED_TRENDS;
  }
}

export async function buildOverview(watchlist: Influencer[], opts: { force?: boolean } = {}): Promise<Overview> {
  const key = cacheKey(watchlist);
  if (!opts.force) {
    const cached = getCache<Overview>(key);
    if (cached) return cached;
  }

  if (!hasX() && !hasSally()) {
    const seeded = seedOverview(watchlist);
    setCache(key, seeded);
    return seeded;
  }

  const sally = await liveSally();
  const [influencers, topAlerts, trends] = await Promise.all([
    liveInfluencers(watchlist, sally.weakAreas),
    liveRisks(sally.weakAreas),
    liveTrends(),
  ]);

  const avgAlignment = influencers.length
    ? Math.round(influencers.reduce((s, i) => s + i.alignmentScore, 0) / influencers.length)
    : 0;
  const avgRisk = influencers.length
    ? Math.round(influencers.reduce((s, i) => s + i.avgRisk, 0) / influencers.length)
    : 0;
  const now = new Date();
  const history = [
    ...SEED_HISTORY.slice(1),
    { date: now.toISOString().slice(0, 10), avgAlignment, riskCount: topAlerts.length },
  ];

  const overview: Overview = {
    generatedAt: now.toISOString(),
    lastSyncAt: now.toISOString(),
    source: influencers.some((i) => i.source === 'live') || sally.source === 'live' ? 'live' : 'seed',
    influencerCount: influencers.length,
    alertsToday: topAlerts.length,
    highAlerts: topAlerts.filter((a) => a.severity === 'high').length,
    avgAlignment,
    avgRisk,
    sally,
    influencers,
    topAlerts,
    trends,
    history,
  };
  setCache(key, overview);
  return overview;
}
