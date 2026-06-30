// Shared domain types. Kept implementation-agnostic so the data layer
// (live X / Sally vs. seed) can satisfy the same contracts (CLAUDE.md §2).

export interface Ref {
  label: string;
  url: string;
}

export interface XUser {
  id: string;
  name: string;
  username: string;
  description: string;
  verified: boolean;
  profileImageUrl: string;
  followers: number;
  tweets: number;
}

export interface XPostMetrics {
  retweet: number;
  reply: number;
  like: number;
  quote: number;
  bookmark: number;
  impression: number;
}

export interface XPost {
  id: string;
  text: string;
  createdAt: string;
  lang: string;
  metrics: XPostMetrics;
  authorHandle?: string;
}

export interface Influencer {
  handle: string;
  reason: string;
  addedAt: string;
}

export interface PostAnalysis {
  post: XPost;
  themes: string[];
  riskScore: number; // 0-100
  flags: string[];
}

export interface InfluencerAnalysis {
  influencer: Influencer;
  user: XUser | null;
  posts: PostAnalysis[];
  alignmentScore: number; // 0-100, advice vs. user biomarkers
  alignmentReasons: string[];
  topThemes: string[];
  avgRisk: number;
  sources: Ref[];
  source: DataSource;
}

export type Severity = 'high' | 'medium' | 'low';

export interface RiskAlert {
  id: string;
  severity: Severity;
  title: string;
  why: string[];
  query: string;
  sample: { handle: string; postId: string; text: string; createdAt: string } | null;
  userContext: string[];
  sources: Ref[];
}

export interface TrendItem {
  name: string;
  postCount?: number;
}

export type DataSource = 'live' | 'seed' | 'unavailable';

export interface SallyVitals {
  sleepScore: number | null;
  recovery: number | null;
  readiness: number | null;
  bodyEnergy: number | null;
  totalSteps: number | null;
  sleepEfficiency: number | null;
  spo2: number | null;
  sleepDebtMin: number | null;
  asleepMin: number | null;
}

export interface SallyMetabolic {
  glucoseWellnessScore: number | null;
  averageGlucose: number | null;
  timeInRange: number | null;
  coefficientOfVariation: number | null;
  spikesTotal: number | null;
}

export interface SallySnapshot {
  capturedAt: string;
  timezone: string;
  vitals: SallyVitals | null;
  metabolic: SallyMetabolic | null;
  insight: { type: string; text: string } | null;
  weakAreas: string[];
  source: DataSource;
  note?: string;
}

export interface HistoryPoint {
  date: string;
  avgAlignment: number;
  riskCount: number;
}

export interface Overview {
  generatedAt: string;
  lastSyncAt: string;
  source: DataSource;
  influencerCount: number;
  alertsToday: number;
  highAlerts: number;
  avgAlignment: number;
  avgRisk: number;
  sally: SallySnapshot;
  influencers: InfluencerAnalysis[];
  topAlerts: RiskAlert[];
  trends: TrendItem[];
  history: HistoryPoint[];
}
