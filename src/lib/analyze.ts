// Deterministic analysis engine. No runtime LLM — every score is reproducible
// and explainable, which keeps it Vercel-friendly and hallucination-free
// (see PLAN.md "require sources + confidence scores").
import { clamp } from './format';
import type {
  InfluencerAnalysis,
  Influencer,
  PostAnalysis,
  Ref,
  RiskAlert,
  Severity,
  XPost,
  XUser,
} from './types';

// ─── reference library (reputable guidelines, cited in the UI) ──────────────
const REF: Record<string, Ref> = {
  diabetes: { label: 'American Diabetes Association — Standards of Care', url: 'https://diabetes.org' },
  sleep: { label: 'AASM — Healthy Sleep', url: 'https://sleepeducation.org' },
  supplements: { label: 'NIH Office of Dietary Supplements', url: 'https://ods.od.nih.gov' },
  diet: { label: 'Dietary Guidelines for Americans', url: 'https://www.dietaryguidelines.gov' },
  rawMilk: { label: 'FDA — Raw Milk Risks', url: 'https://www.fda.gov/food/buy-store-serve-safe-food/raw-milk' },
  fats: { label: 'American Heart Association — Dietary Fats', url: 'https://www.heart.org' },
  fasting: { label: 'NIA/NIH — Intermittent Fasting research', url: 'https://www.nia.nih.gov' },
  exercise: { label: 'WHO — Physical Activity Guidelines', url: 'https://www.who.int' },
  evidence: { label: 'PubMed — primary literature', url: 'https://pubmed.ncbi.nlm.nih.gov' },
};

// ─── theme taxonomy ─────────────────────────────────────────────────────────
interface Theme {
  key: string;
  label: string;
  keywords: string[];
  ref: Ref;
}

const THEMES: Theme[] = [
  { key: 'lowcarb', label: 'Low-carb / keto', keywords: ['keto', 'low carb', 'low-carb', 'ketosis', 'carbs are'], ref: REF.diet },
  { key: 'carnivore', label: 'Carnivore', keywords: ['carnivore', 'meat only', 'animal-based', 'animal based'], ref: REF.diet },
  { key: 'fasting', label: 'Fasting', keywords: ['fasting', 'fasted', 'omad', 'time-restricted', 'autophagy', 'intermittent'], ref: REF.fasting },
  { key: 'supplements', label: 'Supplements', keywords: ['supplement', 'nmn', 'nad', 'resveratrol', 'berberine', 'creatine', 'magnesium', 'vitamin d', 'omega-3', 'fish oil'], ref: REF.supplements },
  { key: 'sleep', label: 'Sleep & circadian', keywords: ['sleep', 'circadian', 'melatonin', 'deep sleep', 'rem ', 'sleep debt'], ref: REF.sleep },
  { key: 'exercise', label: 'Exercise', keywords: ['zone 2', 'zone2', 'vo2', 'strength', 'resistance training', 'cardio', 'workout', 'steps'], ref: REF.exercise },
  { key: 'light', label: 'Light & sun', keywords: ['sunlight', 'morning light', 'red light', 'circadian light'], ref: REF.evidence },
  { key: 'coldheat', label: 'Cold / heat', keywords: ['cold plunge', 'ice bath', 'sauna', 'cold exposure', 'heat therapy'], ref: REF.evidence },
  { key: 'glucose', label: 'Glucose & metabolic', keywords: ['glucose', 'blood sugar', 'cgm', 'insulin', 'metabolic', 'a1c', 'glucose spike'], ref: REF.diabetes },
  { key: 'seedoils', label: 'Seed oils', keywords: ['seed oil', 'vegetable oil', 'canola', 'linoleic'], ref: REF.fats },
  { key: 'protein', label: 'Protein', keywords: ['protein', 'amino acid', 'leucine', 'muscle protein'], ref: REF.diet },
];

// ─── red-flag lexicon ───────────────────────────────────────────────────────
interface Flag {
  re: RegExp;
  weight: number;
  label: string;
  ref?: Ref;
}

const FLAGS: Flag[] = [
  { re: /\b(cure[sd]?|reverse[sd]?|heal[sed]*)\b[^.!?]{0,40}\b(diabetes|cancer|alzheimer'?s?|autism|disease|illness)\b/i, weight: 42, label: 'Claims to cure/reverse a disease', ref: REF.diabetes },
  { re: /\bmiracle\b|\bmagic\b|\bcure-all\b/i, weight: 26, label: 'Miracle / cure-all framing' },
  { re: /\bdetox\b|\bcleanse\b/i, weight: 20, label: 'Detox / cleanse claim', ref: REF.evidence },
  { re: /\b(toxins?|poison)\b/i, weight: 14, label: 'Toxin / poison framing' },
  { re: /\bbig pharma\b|they don'?t want you to know|mainstream medicine is lying/i, weight: 26, label: 'Anti-establishment conspiracy framing' },
  { re: /\b(never|always|everyone|no one|100%|guaranteed|completely)\b/i, weight: 9, label: 'Absolute / overgeneralized claim' },
  { re: /\braw milk\b/i, weight: 22, label: 'Raw milk promotion (FDA: infection risk)', ref: REF.rawMilk },
  { re: /\b(\d+|prolonged|extended|multi-day)[ -]?day fast|prolonged fasting\b/i, weight: 18, label: 'Prolonged fasting', ref: REF.fasting },
  { re: /\bseed oils?\b[^.!?]{0,30}\b(toxic|poison|inflammat|kill)/i, weight: 14, label: 'Seed-oil toxicity claim', ref: REF.fats },
  { re: /\b(natural|herbal)\b[^.!?]{0,20}\b(ozempic|semaglutide)\b|nature'?s ozempic/i, weight: 24, label: 'Unproven Ozempic alternative', ref: REF.evidence },
  { re: /\bstop taking\b[^.!?]{0,30}\b(meds|medication|statin|insulin|metformin)\b/i, weight: 40, label: 'Discourages prescribed medication', ref: REF.diabetes },
];

const STRONG_CLAIM = /\b(cure[sd]?|reverse[sd]?|proven|guaranteed|optimal|the best way)\b/i;
const HAS_LINK = /https?:\/\//i;

function detectThemes(text: string): { labels: string[]; refs: Ref[] } {
  const lc = text.toLowerCase();
  const labels: string[] = [];
  const refs: Ref[] = [];
  for (const t of THEMES) {
    if (t.keywords.some((k) => lc.includes(k))) {
      labels.push(t.label);
      refs.push(t.ref);
    }
  }
  return { labels, refs };
}

export function analyzePost(post: XPost): PostAnalysis {
  const text = post.text ?? '';
  const { labels: themes } = detectThemes(text);
  const flags: string[] = [];
  let score = 0;
  for (const f of FLAGS) {
    if (f.re.test(text)) {
      score += f.weight;
      flags.push(f.label);
    }
  }
  // Strong claim with no linked source is itself a (small) flag.
  if (STRONG_CLAIM.test(text) && !HAS_LINK.test(text)) {
    score += 8;
    flags.push('Strong claim without a linked source');
  }
  return { post, themes, riskScore: clamp(Math.round(score)), flags };
}

// ─── alignment: influencer advice vs. the user's Sally weak areas ────────────
// Each weak area maps to the themes that would actually help it.
const RELEVANCE: Array<{ match: RegExp; themes: string[]; note: string }> = [
  { match: /sleep|readiness|recovery|body energy/i, themes: ['Sleep & circadian', 'Light & sun', 'Cold / heat', 'Exercise'], note: 'sleep / recovery' },
  { match: /glucose|time-in-range|variability|cgm/i, themes: ['Glucose & metabolic', 'Low-carb / keto', 'Fasting', 'Exercise'], note: 'glucose / metabolic' },
];

export function buildInfluencerAnalysis(
  influencer: Influencer,
  user: XUser | null,
  posts: XPost[],
  weakAreas: string[],
  source: InfluencerAnalysis['source'],
): InfluencerAnalysis {
  const analyses = posts.map(analyzePost);
  const avgRisk = analyses.length ? Math.round(analyses.reduce((s, a) => s + a.riskScore, 0) / analyses.length) : 0;

  // Theme frequency → top themes.
  const freq = new Map<string, number>();
  for (const a of analyses) for (const t of a.themes) freq.set(t, (freq.get(t) ?? 0) + 1);
  const topThemes = [...freq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([t]) => t);

  // Alignment starts neutral-high, drops with risk, rises with relevance.
  let alignment = 72 - avgRisk * 0.5;
  const reasons: string[] = [];

  for (const rel of RELEVANCE) {
    if (!weakAreas.some((w) => rel.match.test(w))) continue;
    const hits = topThemes.filter((t) => rel.themes.includes(t));
    if (hits.length) {
      alignment += 6 * hits.length;
      reasons.push(`Posts on ${hits.join(', ').toLowerCase()} — relevant to your ${rel.note} flags.`);
    }
  }

  const flaggedPosts = analyses.filter((a) => a.flags.length).length;
  if (analyses.length === 0) {
    reasons.push('No recent posts loaded — connect the X API to analyze this account.');
  } else if (flaggedPosts) {
    reasons.push(`${flaggedPosts} of ${analyses.length} recent posts contain risk flags (avg risk ${avgRisk}/100).`);
  } else {
    reasons.push(`No risk flags across ${analyses.length} recent posts.`);
  }
  if (topThemes.length) reasons.push(`Main topics: ${topThemes.join(', ')}.`);

  const refs = new Map<string, Ref>();
  for (const a of analyses) {
    const { refs: r } = detectThemes(a.post.text ?? '');
    for (const ref of r) refs.set(ref.url, ref);
  }

  return {
    influencer,
    user,
    posts: analyses,
    alignmentScore: clamp(Math.round(alignment)),
    alignmentReasons: reasons,
    topThemes,
    avgRisk,
    sources: [...refs.values()],
    source,
  };
}

// ─── risky-trend detection ───────────────────────────────────────────────────
export const RISK_QUERIES: Array<{ query: string; label: string }> = [
  { query: '("reverse diabetes" OR "cure diabetes") -is:retweet lang:en', label: 'Diabetes cure/reversal claims' },
  { query: '("seed oils" (toxic OR poison OR inflammation OR kill)) -is:retweet lang:en', label: 'Seed-oil toxicity claims' },
  { query: '("raw milk" (benefits OR heal OR immune)) -is:retweet lang:en', label: 'Raw milk health claims' },
  { query: '("carnivore" (cure OR heal OR reverse OR cured)) -is:retweet lang:en', label: 'Carnivore-cure claims' },
  { query: '((detox OR cleanse) (toxins OR liver OR supplement)) -is:retweet lang:en', label: 'Detox / cleanse products' },
  { query: '(("natural ozempic" OR "nature\'s ozempic") OR (berberine ozempic)) -is:retweet lang:en', label: 'Unproven Ozempic alternatives' },
  { query: '(("prolonged fast" OR "5 day fast" OR "extended fast") (cancer OR cure OR autophagy)) -is:retweet lang:en', label: 'Prolonged-fasting disease claims' },
];

function severityFromScore(score: number): Severity {
  if (score >= 55) return 'high';
  if (score >= 35) return 'medium';
  return 'low';
}

const RISK_THRESHOLD = 28;

export function buildRiskAlert(query: string, label: string, posts: XPost[], weakAreas: string[]): RiskAlert | null {
  let worst: PostAnalysis | null = null;
  for (const p of posts) {
    const a = analyzePost(p);
    if (a.riskScore >= RISK_THRESHOLD && (!worst || a.riskScore > worst.riskScore)) worst = a;
  }
  if (!worst) return null;

  const refs = new Map<string, Ref>();
  for (const f of FLAGS) if (f.ref && f.re.test(worst.post.text)) refs.set(f.ref.url, f.ref);
  const { refs: themeRefs } = detectThemes(worst.post.text);
  for (const r of themeRefs) refs.set(r.url, r);
  if (refs.size === 0) refs.set(REF.evidence.url, REF.evidence);

  const userContext = weakAreas.filter((w) =>
    RELEVANCE.some((rel) => rel.match.test(w) && worst!.themes.some((t) => rel.themes.includes(t))),
  );

  return {
    id: `${query}::${worst.post.id}`,
    severity: severityFromScore(worst.riskScore),
    title: label,
    why: worst.flags.length ? worst.flags : ['Matched a monitored risky-trend search'],
    query,
    sample: {
      handle: worst.post.authorHandle ?? 'unknown',
      postId: worst.post.id,
      text: worst.post.text,
      createdAt: worst.post.createdAt,
    },
    userContext,
    sources: [...refs.values()],
  };
}
