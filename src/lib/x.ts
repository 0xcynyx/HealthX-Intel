// X API v2 client (server-only). App-only Bearer is minted from the app's
// OAuth2 client credentials and cached in-process; refreshed once on a 401.
// App-only context = public reads (users, timelines, recent search, trends).
import 'server-only';
import { env, X_API_BASE, POSTS_PER_INFLUENCER, RECENT_SEARCH_MAX } from './config';
import type { TrendItem, XPost, XUser } from './types';

const USER_FIELDS = 'name,username,description,public_metrics,profile_image_url,verified';
const TWEET_FIELDS = 'created_at,public_metrics,lang';

export class XError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'XError';
  }
}

let cachedBearer: string | null = null;

async function mintBearer(): Promise<string> {
  if (env.xBearerToken) return env.xBearerToken;
  if (!env.xConsumerKey || !env.xConsumerSecret) {
    throw new XError(401, 'X credentials missing (X_CONSUMER_KEY / X_CONSUMER_SECRET)');
  }
  const basic = Buffer.from(`${env.xConsumerKey}:${env.xConsumerSecret}`).toString('base64');
  const res = await fetch(`${X_API_BASE}/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  });
  if (!res.ok) throw new XError(res.status, `token mint failed (${res.status})`);
  const json = (await res.json()) as { access_token?: string };
  if (!json.access_token) throw new XError(500, 'token response missing access_token');
  return json.access_token;
}

async function getBearer(force = false): Promise<string> {
  if (!force && cachedBearer) return cachedBearer;
  cachedBearer = await mintBearer();
  return cachedBearer;
}

async function xGet<T>(path: string): Promise<T> {
  let bearer = await getBearer();
  let res = await fetch(`${X_API_BASE}${path}`, {
    headers: { Authorization: `Bearer ${bearer}` },
    cache: 'no-store',
  });
  if (res.status === 401) {
    bearer = await getBearer(true);
    res = await fetch(`${X_API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${bearer}` },
      cache: 'no-store',
    });
  }
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new XError(res.status, `X ${path} → ${res.status} ${body.slice(0, 160)}`);
  }
  return res.json() as Promise<T>;
}

// ─── raw → domain mappers ───────────────────────────────────────────────────
interface RawUser {
  id: string;
  name: string;
  username: string;
  description?: string;
  verified?: boolean;
  profile_image_url?: string;
  public_metrics?: { followers_count?: number; tweet_count?: number };
}

interface RawPost {
  id: string;
  text: string;
  created_at?: string;
  lang?: string;
  author_id?: string;
  public_metrics?: {
    retweet_count?: number;
    reply_count?: number;
    like_count?: number;
    quote_count?: number;
    bookmark_count?: number;
    impression_count?: number;
  };
}

function mapUser(u: RawUser): XUser {
  return {
    id: u.id,
    name: u.name,
    username: u.username,
    description: u.description ?? '',
    verified: Boolean(u.verified),
    profileImageUrl: (u.profile_image_url ?? '').replace('_normal', '_400x400'),
    followers: u.public_metrics?.followers_count ?? 0,
    tweets: u.public_metrics?.tweet_count ?? 0,
  };
}

function mapPost(p: RawPost, handle?: string): XPost {
  const m = p.public_metrics ?? {};
  return {
    id: p.id,
    text: p.text,
    createdAt: p.created_at ?? '',
    lang: p.lang ?? 'en',
    authorHandle: handle,
    metrics: {
      retweet: m.retweet_count ?? 0,
      reply: m.reply_count ?? 0,
      like: m.like_count ?? 0,
      quote: m.quote_count ?? 0,
      bookmark: m.bookmark_count ?? 0,
      impression: m.impression_count ?? 0,
    },
  };
}

// ─── endpoints ──────────────────────────────────────────────────────────────
export async function getUsersByUsernames(handles: string[]): Promise<XUser[]> {
  if (handles.length === 0) return [];
  const usernames = handles.map((h) => h.replace(/^@/, '')).join(',');
  const json = await xGet<{ data?: RawUser[] }>(
    `/2/users/by?usernames=${encodeURIComponent(usernames)}&user.fields=${USER_FIELDS}`,
  );
  return (json.data ?? []).map(mapUser);
}

export async function getUserTweets(userId: string): Promise<XPost[]> {
  const json = await xGet<{ data?: RawPost[] }>(
    `/2/users/${userId}/tweets?max_results=${POSTS_PER_INFLUENCER}` +
      `&tweet.fields=${TWEET_FIELDS}&exclude=retweets,replies`,
  );
  return (json.data ?? []).map((p) => mapPost(p));
}

export async function searchRecent(query: string, max = RECENT_SEARCH_MAX): Promise<XPost[]> {
  const json = await xGet<{
    data?: RawPost[];
    includes?: { users?: RawUser[] };
  }>(
    `/2/tweets/search/recent?query=${encodeURIComponent(query)}` +
      `&max_results=${max}&tweet.fields=${TWEET_FIELDS}&expansions=author_id&user.fields=username`,
  );
  const byId = new Map((json.includes?.users ?? []).map((u) => [u.id, u.username]));
  return (json.data ?? []).map((p) => mapPost(p, p.author_id ? byId.get(p.author_id) : undefined));
}

export async function getTrends(woeid = env.xTrendsWoeid): Promise<TrendItem[]> {
  const json = await xGet<{ data?: Array<{ trend_name?: string; tweet_count?: number }> }>(
    `/2/trends/by/woeid/${encodeURIComponent(woeid)}`,
  );
  return (json.data ?? [])
    .filter((t) => t.trend_name)
    .map((t) => ({ name: t.trend_name as string, postCount: t.tweet_count }));
}
