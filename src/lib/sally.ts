// Sally (A1C) client (server-only). Talks to the Sally Skills MCP server over
// streamable HTTP (JSON-RPC `tools/call`). Each skill returns its payload as a
// JSON string in result.content[0].text, which we parse back into objects.
import 'server-only';
import { env } from './config';
import type { SallyMetabolic, SallySnapshot, SallyVitals } from './types';

export class SallyError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = 'SallyError';
  }
}

interface JsonRpcResp {
  result?: { content?: Array<{ type: string; text?: string }> };
  error?: { code: number; message: string };
}

// Streamable-HTTP MCP may answer as text/event-stream; collect the data lines.
function extractJson(raw: string, contentType: string): string {
  if (!contentType.includes('text/event-stream')) return raw;
  return raw
    .split('\n')
    .filter((l) => l.startsWith('data:'))
    .map((l) => l.slice(5).trim())
    .join('');
}

async function callTool<T>(name: string, args: Record<string, unknown>): Promise<T> {
  if (!env.sallyApiKey) throw new SallyError(401, 'SALLY_API_KEY missing');
  const res = await fetch(env.sallyMcpUrl, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.sallyApiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: { name, arguments: args },
    }),
    cache: 'no-store',
  });
  const raw = await res.text();
  if (!res.ok) throw new SallyError(res.status, `Sally ${name} → ${res.status} ${raw.slice(0, 160)}`);
  const rpc = JSON.parse(extractJson(raw, res.headers.get('content-type') ?? '')) as JsonRpcResp;
  if (rpc.error) throw new SallyError(rpc.error.code, `Sally ${name}: ${rpc.error.message}`);
  const text = rpc.result?.content?.[0]?.text;
  if (text == null) throw new SallyError(500, `Sally ${name}: empty result`);
  try {
    return JSON.parse(text) as T;
  } catch {
    return text as unknown as T;
  }
}

// ─── raw skill payloads ──────────────────────────────────────────────────────
interface RawVitals {
  date?: string;
  sleep_score?: number;
  recovery?: number;
  readiness?: number;
  body_energy?: number;
  total_steps?: number;
  sleep_efficiency?: number;
  spo2?: number;
  total_time_sleep_debt?: number;
  total_time_asleep?: number;
}
interface RawSync {
  vitals?: RawVitals[];
}
interface RawInsight {
  type?: string;
  response?: string;
}
interface RawMetabolic {
  glucose_wellness_score?: number | null;
  average_glucose_value?: number | null;
  tir_optimal?: number | null;
  coefficient_of_variation?: number | null;
  number_of_spikes_total?: number | null;
}

function latestVitals(rows: RawVitals[]): RawVitals | null {
  if (rows.length === 0) return null;
  return [...rows].sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))[0];
}

function mapVitals(v: RawVitals | null): SallyVitals | null {
  if (!v) return null;
  return {
    sleepScore: v.sleep_score ?? null,
    recovery: v.recovery ?? null,
    readiness: v.readiness ?? null,
    bodyEnergy: v.body_energy ?? null,
    totalSteps: v.total_steps ?? null,
    sleepEfficiency: v.sleep_efficiency ?? null,
    spo2: v.spo2 ?? null,
    sleepDebtMin: v.total_time_sleep_debt ?? null,
    asleepMin: v.total_time_asleep ?? null,
  };
}

function mapMetabolic(m: RawMetabolic): SallyMetabolic | null {
  const empty = m.glucose_wellness_score == null && m.average_glucose_value == null && m.tir_optimal == null;
  if (empty) return null;
  return {
    glucoseWellnessScore: m.glucose_wellness_score ?? null,
    averageGlucose: m.average_glucose_value ?? null,
    timeInRange: m.tir_optimal ?? null,
    coefficientOfVariation: m.coefficient_of_variation ?? null,
    spikesTotal: m.number_of_spikes_total ?? null,
  };
}

// Translate biomarker gaps into plain-language "weak areas" the scoring engine
// and UI use to decide which influencer advice is most relevant to the user.
function deriveWeakAreas(v: SallyVitals | null, m: SallyMetabolic | null): string[] {
  const out: string[] = [];
  if (v) {
    if (v.sleepScore != null && v.sleepScore < 50) out.push(`Poor sleep quality (${Math.round(v.sleepScore)}/100)`);
    if (v.recovery != null && v.recovery < 40) out.push(`Low recovery (${Math.round(v.recovery)}/100)`);
    if (v.readiness != null && v.readiness < 45) out.push(`Low readiness (${Math.round(v.readiness)}/100)`);
    if (v.sleepDebtMin != null && v.sleepDebtMin > 60) out.push(`Sleep debt ${Math.round(v.sleepDebtMin)} min`);
    if (v.bodyEnergy != null && v.bodyEnergy < 30) out.push(`Low body energy (${Math.round(v.bodyEnergy)}/100)`);
  }
  if (!m) out.push('No CGM/glucose data synced');
  else {
    if (m.timeInRange != null && m.timeInRange < 70) out.push('Time-in-range below 70%');
    if (m.coefficientOfVariation != null && m.coefficientOfVariation > 36) out.push('High glucose variability');
  }
  return out;
}

export async function buildSallySnapshot(insightType: 'morning' | 'afternoon' | 'evening' | 'auto' = 'auto'): Promise<SallySnapshot> {
  const tz = env.sallyTimezone;
  const [syncR, insightR, metaR] = await Promise.allSettled([
    callTool<RawSync>('health_sync', {}),
    callTool<RawInsight>('health_insights', { type: insightType, timezone: tz }),
    callTool<RawMetabolic>('metabolic_overview', { timezone: tz }),
  ]);

  const vitals = syncR.status === 'fulfilled' ? mapVitals(latestVitals(syncR.value.vitals ?? [])) : null;
  const metabolic = metaR.status === 'fulfilled' ? mapMetabolic(metaR.value) : null;
  const insight =
    insightR.status === 'fulfilled' && insightR.value.response
      ? { type: insightR.value.type ?? insightType, text: insightR.value.response }
      : null;

  // If every Sally call failed, surface that rather than a misleading snapshot.
  const allFailed = syncR.status === 'rejected' && insightR.status === 'rejected' && metaR.status === 'rejected';

  return {
    capturedAt: new Date().toISOString(),
    timezone: tz,
    vitals,
    metabolic,
    insight,
    weakAreas: deriveWeakAreas(vitals, metabolic),
    source: allFailed ? 'unavailable' : 'live',
    note: metaR.status === 'rejected' ? 'CGM/glucose unavailable right now' : undefined,
  };
}
