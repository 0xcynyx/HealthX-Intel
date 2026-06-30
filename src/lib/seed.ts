// Seed / fallback dataset. Used only when live credentials are absent or every
// upstream call fails — the live X + Sally path is the default.
//
// Profiles below are REAL public data captured from the X API. We deliberately
// do NOT ship invented posts attributed to real people; when X is connected the
// dashboard analyzes their actual recent posts, and when it isn't we show the
// profile with a "connect X" note rather than fabricated quotes.
import { buildInfluencerAnalysis } from './analyze';
import type { Influencer, Overview, SallySnapshot, TrendItem, XUser, HistoryPoint } from './types';

export const SEED_WATCHLIST: Influencer[] = [
  { handle: 'hubermanlab', reason: 'Neuroscience protocols — sleep, light, dopamine, supplements.', addedAt: '2026-06-01T00:00:00Z' },
  { handle: 'PeterAttiaMD', reason: 'Longevity medicine, Zone 2, ApoB, glucose.', addedAt: '2026-06-01T00:00:00Z' },
  { handle: 'foundmyfitness', reason: 'Rhonda Patrick — nutrition, micronutrients, aging.', addedAt: '2026-06-01T00:00:00Z' },
  { handle: 'bryan_johnson', reason: 'Blueprint — aggressive biomarker optimization & supplements.', addedAt: '2026-06-01T00:00:00Z' },
  { handle: 'maxlugavere', reason: 'Nutrition & brain health, "data over dogma".', addedAt: '2026-06-01T00:00:00Z' },
  { handle: 'paulsaladinomd', reason: 'Animal-based / carnivore — high-conviction, controversial. Good risk contrast.', addedAt: '2026-06-01T00:00:00Z' },
];

export const SEED_USERS: Record<string, XUser> = {
  hubermanlab: {
    id: '4416456732',
    name: 'Andrew D. Huberman, Ph.D.',
    username: 'hubermanlab',
    description: 'Professor of Neurobiology and Ophthalmology at Stanford Medicine • Host of Huberman Lab • science and health research and public education',
    verified: false,
    profileImageUrl: 'https://pbs.twimg.com/profile_images/1339713932085346306/jDTi4HKH_400x400.jpg',
    followers: 1826684,
    tweets: 15237,
  },
  peterattiamd: {
    id: '349347318',
    name: 'Peter Attia',
    username: 'PeterAttiaMD',
    description: '',
    verified: false,
    profileImageUrl: 'https://pbs.twimg.com/profile_images/1887223171494948864/upGIlnVZ_400x400.jpg',
    followers: 615469,
    tweets: 8652,
  },
  foundmyfitness: {
    id: '66590132',
    name: 'Dr. Rhonda Patrick',
    username: 'foundmyfitness',
    description: 'Ph.D in biomedical science interested in nutrition, brain & aging. Host of FoundMyFitness podcast',
    verified: false,
    profileImageUrl: 'https://pbs.twimg.com/profile_images/2030430383016460288/zkI-bJbP_400x400.jpg',
    followers: 1274446,
    tweets: 10757,
  },
  bryan_johnson: {
    id: '17468569',
    name: 'Bryan Johnson',
    username: 'bryan_johnson',
    description: 'Conquering death will be humanity’s greatest achievement.',
    verified: false,
    profileImageUrl: 'https://pbs.twimg.com/profile_images/1888004001872101378/jVNJQ-iu_400x400.jpg',
    followers: 1549438,
    tweets: 15606,
  },
  maxlugavere: {
    id: '26829539',
    name: 'Max Lugavere',
    username: 'maxlugavere',
    description: 'NYT best-selling author. Nutrition and brain health. Data over dogma. Host of The Genius Life podcast.',
    verified: false,
    profileImageUrl: 'https://pbs.twimg.com/profile_images/1286384830083547136/EdvjrHAU_400x400.jpg',
    followers: 670417,
    tweets: 24949,
  },
};

// Real Sally snapshot captured for this account (sleep/vitals present, CGM not
// synced). Mirrors the live SallySnapshot shape.
export const SEED_SALLY: SallySnapshot = {
  capturedAt: '2026-06-30T09:30:00Z',
  timezone: 'America/Los_Angeles',
  vitals: {
    sleepScore: 32,
    recovery: 32,
    readiness: 36,
    bodyEnergy: 5,
    totalSteps: 4050,
    sleepEfficiency: 15,
    spo2: 0.96,
    sleepDebtMin: 139,
    asleepMin: 312,
  },
  metabolic: null,
  insight: {
    type: 'evening',
    text: 'Sleep and recovery are running low — readiness 36/100 with ~139 min of sleep debt. Prioritise an earlier, screen-free wind-down and protein-forward evening food to steady overnight glucose. No CGM is synced, so metabolic scoring is paused until a sensor reports.',
  },
  weakAreas: [
    'Poor sleep quality (32/100)',
    'Low recovery (32/100)',
    'Low readiness (36/100)',
    'Sleep debt 139 min',
    'Low body energy (5/100)',
    'No CGM/glucose data synced',
  ],
  source: 'seed',
  note: 'Seeded snapshot — connect Sally for live data.',
};

export const SEED_TRENDS: TrendItem[] = [
  { name: 'Zone 2 cardio' },
  { name: 'GLP-1' },
  { name: 'Creatine' },
  { name: 'Sleep debt' },
  { name: 'Seed oils' },
  { name: 'Magnesium glycinate' },
];

export const SEED_HISTORY: HistoryPoint[] = Array.from({ length: 7 }, (_, i) => {
  const d = new Date();
  d.setDate(d.getDate() - (6 - i));
  return {
    date: d.toISOString().slice(0, 10),
    avgAlignment: [58, 61, 57, 64, 60, 66, 63][i],
    riskCount: [3, 2, 4, 1, 2, 1, 2][i],
  };
});

export function seedOverview(watchlist: Influencer[]): Overview {
  const influencers = watchlist.map((inf) =>
    buildInfluencerAnalysis(inf, SEED_USERS[inf.handle.toLowerCase()] ?? null, [], SEED_SALLY.weakAreas, 'seed'),
  );
  const avgAlignment = influencers.length
    ? Math.round(influencers.reduce((s, i) => s + i.alignmentScore, 0) / influencers.length)
    : 0;
  const now = new Date().toISOString();
  return {
    generatedAt: now,
    lastSyncAt: SEED_SALLY.capturedAt,
    source: 'seed',
    influencerCount: influencers.length,
    alertsToday: 0,
    highAlerts: 0,
    avgAlignment,
    avgRisk: 0,
    sally: SEED_SALLY,
    influencers,
    topAlerts: [],
    trends: SEED_TRENDS,
    history: SEED_HISTORY,
  };
}
