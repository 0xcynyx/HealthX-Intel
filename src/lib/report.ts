// Pure report builder — turns an Overview into shareable Markdown. No server
// deps so it runs on the client (download button) and server alike.
import type { Overview } from './types';

const fmt = (v: number | null | undefined): string => (v == null ? '—' : String(Math.round(v)));

export function buildReport(o: Overview): string {
  const L: string[] = [];
  L.push('# HealthX-Intel — Daily Report');
  L.push(`Generated ${new Date(o.generatedAt).toUTCString()} · data source: ${o.source}`);
  L.push('');
  L.push('## Summary');
  L.push(`- Influencers tracked: ${o.influencerCount}`);
  L.push(`- Risk alerts: ${o.alertsToday} (${o.highAlerts} high severity)`);
  L.push(`- Average alignment with your biomarkers: ${o.avgAlignment}/100`);
  L.push(`- Average recent-post risk: ${o.avgRisk}/100`);
  L.push('');

  L.push('## Your Sally snapshot');
  const v = o.sally.vitals;
  if (v) {
    L.push(`- Readiness ${fmt(v.readiness)} · Recovery ${fmt(v.recovery)} · Sleep ${fmt(v.sleepScore)} · Body energy ${fmt(v.bodyEnergy)}`);
  }
  if (o.sally.metabolic?.timeInRange != null) L.push(`- Time-in-range ${fmt(o.sally.metabolic.timeInRange)}%`);
  if (o.sally.weakAreas.length) L.push(`- Flags: ${o.sally.weakAreas.join('; ')}`);
  L.push('');

  L.push('## Influencer alignment');
  for (const a of o.influencers) {
    const themes = a.topThemes.length ? ` — ${a.topThemes.join(', ')}` : '';
    L.push(`- @${a.influencer.handle}: alignment ${a.alignmentScore}/100, avg risk ${a.avgRisk}/100${themes}`);
  }
  L.push('');

  if (o.topAlerts.length) {
    L.push('## Risk alerts');
    for (const al of o.topAlerts) {
      L.push(`### [${al.severity.toUpperCase()}] ${al.title}`);
      L.push(`- Flags: ${al.why.join('; ')}`);
      if (al.sample) {
        const text = al.sample.text.replace(/\s+/g, ' ').slice(0, 220);
        L.push(`- @${al.sample.handle}: "${text}"`);
      }
      if (al.userContext.length) L.push(`- Relevant to you: ${al.userContext.join('; ')}`);
      L.push(`- Cross-check: ${al.sources.map((s) => s.label).join('; ')}`);
      L.push('');
    }
  }

  if (o.trends.length) {
    L.push('## Trending on X');
    L.push(o.trends.slice(0, 10).map((t) => t.name).join(' · '));
    L.push('');
  }

  L.push('---');
  L.push('_Information only — not medical advice. Verify important decisions with a qualified clinician._');
  return L.join('\n');
}
